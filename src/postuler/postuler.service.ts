import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { Repository } from 'typeorm';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { Statut } from '../common/enum/statut.enum';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../common/enum/notification-type.enum';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';

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
   * Retourne toutes les candidatures, avec les relations offre et étudiant.
   */
  async findAll(): Promise<Postuler[]> {
    return this.postulerRepository.find({
      relations: { offre: true, etudiant: true },
      order: { date_candidature: 'DESC' },
    });
  }

  /**
   * Retourne une candidature par son id, ou lève une 404 si introuvable.
   */
  async findOne(id: string): Promise<Postuler> {
    const postuler = await this.postulerRepository.findOne({
      where: { id },
      relations: { offre: true, etudiant: true },
    });

    if (!postuler) {
      ExceptionFactory.notFound(`Candidature ${id} introuvable.`);
    }

    return postuler;
  }

  /**
   * Retourne toutes les candidatures reçues pour une offre donnée.
   */
  async findByOffre(offreId: string): Promise<Postuler[]> {
    return this.postulerRepository.find({
      where: { offreId },
      relations: { etudiant: true },
      order: { date_candidature: 'DESC' },
    });
  }

  /**
   * Retourne toutes les candidatures d'un étudiant donné.
   */
  async findByEtudiant(etudiantId: string): Promise<Postuler[]> {
    return this.postulerRepository.find({
      where: { etudiantId },
      relations: { offre: true },
      order: { date_candidature: 'DESC' },
    });
  }

  /**
   * Met à jour le statut d'une candidature (ex: acceptée / refusée).
   */
  async updateStatut(
    id: string,
    dto: UpdatePostulerStatutDto,
    currentUser: { id: string; email: string },
  ): Promise<Postuler> {
    const postuler = await this.findOne(id);
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
        message = `Votre candidature pour "${postuler.offre?.descriptions}" a été acceptée.`;
        break;
      case StatutCandidature.REFUSEE:
        notificationType = NotificationType.CANDIDATURE_REFUSEE;
        titre = 'Candidature refusée';
        message = `Votre candidature pour "${postuler.offre?.descriptions}" a été refusée.`;
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
  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const postuler = await this.findOne(id);
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
