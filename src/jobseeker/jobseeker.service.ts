// jobseeker/jobseeker.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Jobseeker } from './jobseeker.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { UpsertJobseekerDto } from './dto/upsert-jobseeker.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { Statut } from '../common/enum/statut.enum';
import { PaginationDto, paginer, ResultatPagine } from '../common/pagination';

@Injectable()
export class JobseekerService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Jobseeker)
    private readonly jobseekerRepo: Repository<Jobseeker>,
  ) {}

  /** Passe l'étudiant en recherche d'emploi (ou met à jour ses informations). */
  activer(
    studentId: string,
    dto: UpsertJobseekerDto,
    currentUser: { id: string },
  ): Promise<Jobseeker> {
    return this.dataSource.transaction((manager) =>
      this.activerDans(manager, studentId, dto, currentUser),
    );
  }

  /** Retire l'étudiant de la recherche d'emploi (soft delete de la ligne jobseeker). */
  desactiver(studentId: string, currentUser: { id: string }): Promise<void> {
    return this.dataSource.transaction((manager) =>
      this.desactiverDans(manager, studentId, currentUser),
    );
  }

  /**
   * Version à appeler depuis une transaction existante, par exemple depuis la
   * mise à jour d'un étudiant quand `is_job_seeker` passe à true.
   * Idempotente : on peut l'appeler plusieurs fois sans créer de doublon.
   */
  async activerDans(
    manager: EntityManager,
    studentId: string,
    dto: UpsertJobseekerDto,
    currentUser: { id: string },
  ): Promise<Jobseeker> {
    const etudiant = await manager.findOne(Etudiant, {
      where: { id: studentId },
    });
    if (!etudiant) ExceptionFactory.notFound('etudiant', studentId);

    await manager.update(Etudiant, { id: studentId }, { is_job_seeker: true });

    // Une seule ligne par étudiant (contrainte unique du OneToOne),
    // y compris si elle a été supprimée logiquement : on la réactive.
    const existant = await manager.findOne(Jobseeker, {
      where: { studentId },
    });

    if (!existant) {
      return manager.save(
        manager.create(Jobseeker, {
          studentId,
          entreprise: dto.entreprise ?? null,
          poste: dto.poste ?? null,
          is_jobless: dto.is_jobless ?? true,
          dte_creation: new Date(),
          create_by: currentUser.id,
        }),
      );
    }

    await manager.update(
      Jobseeker,
      { id: existant.id },
      {
        ...(dto.entreprise !== undefined && { entreprise: dto.entreprise }),
        ...(dto.poste !== undefined && { poste: dto.poste }),
        ...(dto.is_jobless !== undefined && { is_jobless: dto.is_jobless }),
        statut: Statut.ACTIF,
        updated_by: currentUser.id,
        dte_suppression: () => 'NULL', // réactivation : on efface la date de suppression
      },
    );

    return manager.findOneOrFail(Jobseeker, { where: { id: existant.id } });
  }

  async desactiverDans(
    manager: EntityManager,
    studentId: string,
    currentUser: { id: string },
  ): Promise<void> {
    const etudiant = await manager.findOne(Etudiant, {
      where: { id: studentId },
    });
    if (!etudiant) ExceptionFactory.notFound('etudiant', studentId);

    await manager.update(Etudiant, { id: studentId }, { is_job_seeker: false });

    await manager.update(
      Jobseeker,
      { studentId, statut: Not(Statut.SUPPRIME) },
      {
        statut: Statut.SUPPRIME,
        dte_suppression: new Date(),
        updated_by: currentUser.id,
      },
    );
  }

  async findByStudent(studentId: string): Promise<Jobseeker> {
    const jobseeker = await this.jobseekerRepo.findOne({
      where: { studentId, statut: Not(Statut.SUPPRIME) },
    });
    if (!jobseeker) ExceptionFactory.notFound('jobseeker', studentId);
    return jobseeker;
  }

  async findAll(pagination: PaginationDto): Promise<ResultatPagine<Jobseeker>> {
    const { page, limite } = pagination;

    const resultat = await this.jobseekerRepo.findAndCount({
      where: { statut: Not(Statut.SUPPRIME) },
      relations: { etudiant: true },
      order: { dte_creation: 'DESC' },
      skip: (page - 1) * limite,
      take: limite,
    });

    return paginer(resultat, pagination);
  }
}
