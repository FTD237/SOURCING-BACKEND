import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { Statut } from '../common/enum/statut.enum';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../common/enum/notification-type.enum';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';
import { Roles } from '../common/enum/roles.enum';

export type CurrentUser = { id: string; email: string; role: Roles };

@Injectable()
export class PostulerService {
  constructor(
    @InjectRepository(Postuler)
    private readonly postulerRepository: Repository<Postuler>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Crée une nouvelle candidature (un étudiant postule à une offre).
   * Vérifie qu'une candidature identique n'existe pas déjà.
   */
  async create(
    dto: CreatePostulerDto,
    currentUser: { id: string; email: string },
  ): Promise<Postuler> {
    const existing = await this.postulerRepository.findOne({
      where: { offreId: dto.offreId, etudiantId: dto.etudiantId },
    });

    if (existing) {
      ExceptionFactory.conflict('Cet étudiant a déjà postulé à cette offre');
    }

    const postuler = this.postulerRepository.create(dto);
    postuler.create_by = currentUser.id;
    postuler.dte_creation = new Date();
    const saved = await this.postulerRepository.save(postuler);

    const withRelations = await this.postulerRepository.findOne({
      where: { id: saved.id },
      relations: { offre: { company: true }, etudiant: true },
    });

    if (withRelations?.offre?.company) {
      await this.notificationService.create({
        userId: withRelations.offre.company.user_id,
        type: NotificationType.CANDIDATURE_RECUE,
        titre: 'Nouvelle candidature reçue',
        message: `Vous avez reçu une nouvelle candidature pour l'offre "${withRelations.offre.descriptions}".`,
        data: { offreId: withRelations.offreId, postulerId: saved.id },
      });
    }

    return saved;
  }

  /**
   * Filtre d'accès selon le rôle :
   * - MANAGER  : toutes les candidatures
   * - RH       : candidatures des offres qu'il a postées
   * - ETUDIANT : ses propres candidatures
   */
  private accessWhere(user: CurrentUser): FindOptionsWhere<Postuler> {
    switch (user.role) {
      case Roles.MANAGER:
        return {};
      case Roles.RH:
        return { offre: { create_by: user.id } };
      case Roles.ETUDIANT:
        return { etudiant: { userId: user.id } };
      default:
        ExceptionFactory.forbidden('Accès Refuser');
    }
  }

  async findAll(user: CurrentUser): Promise<Postuler[]> {
    return this.postulerRepository.find({
      where: this.accessWhere(user),
      relations: { offre: { company: true }, etudiant: { user: true } },
      order: { date_candidature: 'DESC' },
    });
  }

  async findOne(id: string, user: CurrentUser): Promise<Postuler> {
    const postuler = await this.postulerRepository.findOne({
      where: { id, ...this.accessWhere(user) },
      relations: { offre: { company: true }, etudiant: { user: true } },
    });

    // 404 aussi quand la candidature existe, mais n'est pas accessible :
    // on ne révèle pas son existence.
    if (!postuler) {
      ExceptionFactory.notFound(`Candidature ${id} introuvable.`);
    }

    return postuler;
  }

  async findByOffre(offreId: string, user: CurrentUser): Promise<Postuler[]> {
    return this.postulerRepository.find({
      where: { offreId, ...this.accessWhere(user) },
      relations: { etudiant: { user: true } },
      order: { date_candidature: 'DESC' },
    });
  }

  async findByEtudiant(
    etudiantId: string,
    user: CurrentUser,
  ): Promise<Postuler[]> {
    return this.postulerRepository.find({
      where: { etudiantId, ...this.accessWhere(user) },
      relations: { offre: { company: true } },
      order: { date_candidature: 'DESC' },
    });
  }

  /**
   * Met à jour le statut d'une candidature (ex: acceptée / refusée).
   */
  async updateStatut(
    id: string,
    dto: UpdatePostulerStatutDto,
    currentUser: CurrentUser,
  ): Promise<Postuler> {
    const postuler = await this.findOne(id, currentUser);
    postuler.statut_candidature = dto.statut;
    postuler.updated_by = currentUser.id;
    postuler.dte_modif = new Date();
    const saved = await this.postulerRepository.save(postuler);

    await this.notifyStatutChange(postuler, dto.statut);

    return saved;
  }

  private async notifyStatutChange(
    postuler: Postuler,
    statut: StatutCandidature,
  ): Promise<void> {
    if (!postuler.etudiant) return;

    let notificationType: NotificationType | null = null;
    let titre = '';
    let message = '';

    switch (statut) {
      case StatutCandidature.ACCEPTEE:
        notificationType = NotificationType.CANDIDATURE_ACCEPTEE;
        titre = 'Candidature acceptée';
        message = `Votre candidature pour "${postuler.offre?.titre}" a été acceptée.`;
        break;
      case StatutCandidature.REFUSEE:
        notificationType = NotificationType.CANDIDATURE_REFUSEE;
        titre = 'Candidature refusée';
        message = `Votre candidature pour "${postuler.offre?.titre}" a été refusée.`;
        break;
      default:
        return; // EN_ATTENTE ou autre statut : pas de notification
    }

    await this.notificationService.create({
      userId: postuler.etudiant.userId,
      type: notificationType,
      titre,
      message,
      data: { offreId: postuler.offreId, postulerId: postuler.id },
    });
  }

  /**
   * Supprime une candidature (retrait de candidature)
   */
  async remove(id: string, currentUser: CurrentUser): Promise<void> {
    const postuler = await this.findOne(id, currentUser);
    postuler.statut = Statut.SUPPRIME;
    postuler.dte_suppression = new Date();
    postuler.updated_by = currentUser.id;
    try {
      await this.postulerRepository.save(postuler);
    } catch (error) {
      ExceptionFactory.database(error, 'Postuler');
    }
  }
}
