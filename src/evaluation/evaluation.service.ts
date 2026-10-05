// evaluation/evaluation.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Experience } from '../experience/experience.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { Statut } from '../common/enum/statut.enum';
import { PaginationDto, paginer, ResultatPagine } from '../common/pagination';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Evaluation)
    private readonly evalRepo: Repository<Evaluation>,
  ) {}

  async create(
    companyId: string,
    dto: CreateEvaluationDto,
    currentUser: { id: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const experience = await manager.findOne(Experience, {
        where: { id: dto.experience_id },
      });
      if (!experience) ExceptionFactory.notFound('Expérience introuvable');

      if (experience.company_id !== companyId)
        ExceptionFactory.forbidden(
          "Cette expérience n'appartient pas à votre entreprise",
        );

      if (new Date(experience.date_fin) > new Date())
        ExceptionFactory.badRequest("L'expérience n'est pas encore terminée");

      const exists = await manager.exists(Evaluation, {
        where: { experience_id: experience.id, statut: Not(Statut.SUPPRIME) },
      });
      if (exists)
        throw new ConflictException('Cette expérience a déjà été évaluée');

      const evaluation = await manager.save(
        manager.create(Evaluation, {
          experience_id: experience.id,
          student_id: experience.student_id,
          company_id: companyId,
          note: dto.note,
          commentaire: dto.commentaire ?? null,
          dte_creation: new Date(),
          create_by: currentUser.id,
        }),
      );

      await this.recomputeStarRate(manager, experience.student_id);
      return evaluation;
    });
  }

  async remove(
    companyId: string,
    evaluationId: string,
    currentUser: { id: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const ev = await manager.findOne(Evaluation, {
        where: { id: evaluationId, statut: Not(Statut.SUPPRIME) },
      });
      if (!ev) ExceptionFactory.notFound('evaluation', evaluationId);
      if (ev.company_id !== companyId) ExceptionFactory.forbidden();

      await manager.update(
        Evaluation,
        { id: ev.id },
        {
          statut: Statut.SUPPRIME,
          dte_suppression: new Date(),
          updated_by: currentUser.id,
        },
      );
      await this.recomputeStarRate(manager, ev.student_id);
    });
  }

  async update(
    companyId: string,
    evaluationId: string,
    dto: UpdateEvaluationDto,
    currentUser: { id: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const ev = await manager.findOne(Evaluation, {
        where: { id: evaluationId, statut: Not(Statut.SUPPRIME) },
      });
      if (!ev) ExceptionFactory.notFound('evaluation', evaluationId);
      if (ev.company_id !== companyId) ExceptionFactory.forbidden();

      if (dto.note !== undefined) ev.note = dto.note;
      if (dto.commentaire !== undefined) ev.commentaire = dto.commentaire;
      ev.updated_by = currentUser.id;
      ev.dte_modif = new Date();

      const saved = await manager.save(ev);

      if (dto.note !== undefined) {
        await this.recomputeStarRate(manager, ev.student_id);
      }
      return saved;
    });
  }

  async findByStudent(
    studentId: string,
    pagination: PaginationDto,
  ): Promise<ResultatPagine<Evaluation>> {
    const { page, limite } = pagination;

    const resultat = await this.evalRepo.findAndCount({
      where: { student_id: studentId, statut: Not(Statut.SUPPRIME) },
      relations: { company: true },
      order: { dte_creation: 'DESC' },
      skip: (page - 1) * limite,
      take: limite,
    });

    return paginer(resultat, pagination);
  }

  private async recomputeStarRate(manager: EntityManager, studentId: string) {
    const resultat = await manager
      .createQueryBuilder(Evaluation, 'e')
      .select('COALESCE(AVG(e.note), 0)', 'avg')
      .where('e.student_id = :studentId', { studentId })
      .andWhere('e.statut <> :supprime', { supprime: Statut.SUPPRIME })
      .getRawOne<{ avg: string }>();

    const moyenne = Number.parseFloat(resultat?.avg ?? '0');

    await manager.update(
      Etudiant,
      { id: studentId },
      { star_rate: Math.round(moyenne * 10) / 10 },
    );
  }
}
