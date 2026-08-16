import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { Repository } from 'typeorm';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { Statut } from '../common/enum/statut.enum';

@Injectable()
export class PostulerService {
  constructor(
    @InjectRepository(Postuler)
    private readonly postulerRepository: Repository<Postuler>,
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
    return this.postulerRepository.save(postuler);
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
    return this.postulerRepository.save(postuler);
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
