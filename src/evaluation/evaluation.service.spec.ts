// evaluation/evaluation.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './evaluation.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Statut } from '../common/enum/statut.enum';
import { PaginationDto } from '../common/pagination';

const COMPANY_ID = 'company-1';
const OTHER_COMPANY_ID = 'company-2';
const STUDENT_ID = 'student-1';
const USER = { id: 'user-1' };
const anyDate: unknown = expect.any(Date);

function makeManager(avg: string | null = '4') {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(avg === null ? undefined : { avg }),
  };
  return {
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn((entity: object) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => qb),
    qb,
  };
}

function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    id: 'eval-1',
    experience_id: 'exp-1',
    student_id: STUDENT_ID,
    company_id: COMPANY_ID,
    note: 3,
    commentaire: 'Correct',
    statut: Statut.ACTIF,
    ...overrides,
  } as Evaluation;
}

describe('EvaluationService', () => {
  let service: EvaluationService;
  let manager: ReturnType<typeof makeManager>;
  let evalRepo: { findAndCount: jest.Mock };

  async function setup(avg: string | null = '4') {
    manager = makeManager(avg);
    evalRepo = { findAndCount: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EvaluationService,
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
          },
        },
        { provide: getRepositoryToken(Evaluation), useValue: evalRepo },
      ],
    }).compile();

    service = moduleRef.get(EvaluationService);
  }

  beforeEach(async () => {
    await setup();
  });

  describe('create', () => {
    const dto = { experience_id: 'exp-1', note: 5, commentaire: 'Excellent' };
    const pastExperience = {
      id: 'exp-1',
      company_id: COMPANY_ID,
      student_id: STUDENT_ID,
      date_fin: '2020-01-01',
    };

    it("lève NotFound si l'expérience n'existe pas", async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.create(COMPANY_ID, dto, USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it("lève Forbidden si l'expérience appartient à une autre entreprise", async () => {
      manager.findOne.mockResolvedValue({
        ...pastExperience,
        company_id: OTHER_COMPANY_ID,
      });

      await expect(service.create(COMPANY_ID, dto, USER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it("lève BadRequest si l'expérience n'est pas terminée", async () => {
      manager.findOne.mockResolvedValue({
        ...pastExperience,
        date_fin: new Date(Date.now() + 24 * 3600 * 1000),
      });

      await expect(service.create(COMPANY_ID, dto, USER)).rejects.toThrow(
        BadRequestException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it("lève Conflict si l'expérience a déjà une évaluation active", async () => {
      manager.findOne.mockResolvedValue(pastExperience);
      manager.exists.mockResolvedValue(true);

      await expect(service.create(COMPANY_ID, dto, USER)).rejects.toThrow(
        ConflictException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('vérifie l’unicité en ignorant les évaluations supprimées', async () => {
      manager.findOne.mockResolvedValue(pastExperience);
      manager.exists.mockResolvedValue(false);

      await service.create(COMPANY_ID, dto, USER);

      const [entity, options] = manager.exists.mock.calls[0] as [
        unknown,
        { where: { experience_id: string; statut: { _type: string } } },
      ];
      expect(entity).toBe(Evaluation);
      expect(options.where.experience_id).toBe('exp-1');
      expect(options.where.statut._type).toBe('not');
    });

    it("crée l'évaluation avec les champs d'audit et recalcule la moyenne", async () => {
      manager.findOne.mockResolvedValue(pastExperience);
      manager.exists.mockResolvedValue(false);

      const result = await service.create(COMPANY_ID, dto, USER);

      expect(manager.create).toHaveBeenCalledWith(
        Evaluation,
        expect.objectContaining({
          experience_id: 'exp-1',
          student_id: STUDENT_ID,
          company_id: COMPANY_ID,
          note: 5,
          commentaire: 'Excellent',
          create_by: USER.id,
          dte_creation: anyDate,
        }),
      );
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(manager.update).toHaveBeenCalledWith(
        Etudiant,
        { id: STUDENT_ID },
        { star_rate: 4 },
      );
      expect(result).toEqual(expect.objectContaining({ note: 5 }));
    });

    it('met le commentaire à null quand il est absent', async () => {
      manager.findOne.mockResolvedValue(pastExperience);
      manager.exists.mockResolvedValue(false);

      await service.create(
        COMPANY_ID,
        { experience_id: 'exp-1', note: 3 },
        USER,
      );

      expect(manager.create).toHaveBeenCalledWith(
        Evaluation,
        expect.objectContaining({ commentaire: null }),
      );
    });
  });

  describe('update', () => {
    it("lève NotFound si l'évaluation n'existe pas", async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.update(COMPANY_ID, 'eval-1', { note: 4 }, USER),
      ).rejects.toThrow(NotFoundException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it("lève Forbidden si l'évaluation appartient à une autre entreprise", async () => {
      manager.findOne.mockResolvedValue(
        makeEvaluation({ company_id: OTHER_COMPANY_ID }),
      );

      await expect(
        service.update(COMPANY_ID, 'eval-1', { note: 4 }, USER),
      ).rejects.toThrow(ForbiddenException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('modifie la note, trace updated_by et recalcule la moyenne', async () => {
      manager.findOne.mockResolvedValue(makeEvaluation());

      const result = await service.update(
        COMPANY_ID,
        'eval-1',
        { note: 5 },
        USER,
      );

      expect(result).toEqual(
        expect.objectContaining({ note: 5, updated_by: USER.id }),
      );
      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(manager.update).toHaveBeenCalledWith(
        Etudiant,
        { id: STUDENT_ID },
        { star_rate: 4 },
      );
    });

    it('ne recalcule pas la moyenne quand seul le commentaire change', async () => {
      manager.findOne.mockResolvedValue(makeEvaluation());

      const result = await service.update(
        COMPANY_ID,
        'eval-1',
        { commentaire: 'Nouveau commentaire' },
        USER,
      );

      expect(result).toEqual(
        expect.objectContaining({
          note: 3,
          commentaire: 'Nouveau commentaire',
        }),
      );
      expect(manager.createQueryBuilder).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('ne modifie rien quand le corps est vide', async () => {
      manager.findOne.mockResolvedValue(makeEvaluation());

      const result = await service.update(COMPANY_ID, 'eval-1', {}, USER);

      expect(result).toEqual(
        expect.objectContaining({ note: 3, commentaire: 'Correct' }),
      );
      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it("lève NotFound si l'évaluation n'existe pas ou est déjà supprimée", async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.remove(COMPANY_ID, 'eval-1', USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(manager.update).not.toHaveBeenCalled();
    });

    it("lève Forbidden si l'évaluation appartient à une autre entreprise", async () => {
      manager.findOne.mockResolvedValue(
        makeEvaluation({ company_id: OTHER_COMPANY_ID }),
      );

      await expect(service.remove(COMPANY_ID, 'eval-1', USER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('fait un soft delete puis recalcule la moyenne', async () => {
      manager.findOne.mockResolvedValue(makeEvaluation());

      await service.remove(COMPANY_ID, 'eval-1', USER);

      expect(manager.update).toHaveBeenNthCalledWith(
        1,
        Evaluation,
        { id: 'eval-1' },
        {
          statut: Statut.SUPPRIME,
          dte_suppression: anyDate,
          updated_by: USER.id,
        },
      );
      expect(manager.update).toHaveBeenNthCalledWith(
        2,
        Etudiant,
        { id: STUDENT_ID },
        { star_rate: 4 },
      );
    });
  });

  describe('findByStudent', () => {
    it('pagine et exclut les évaluations supprimées', async () => {
      evalRepo.findAndCount.mockResolvedValue([[makeEvaluation()], 25]);
      const pagination = { page: 2, limite: 10 } as PaginationDto;

      const result = await service.findByStudent(STUDENT_ID, pagination);

      const [options] = evalRepo.findAndCount.mock.calls[0] as [
        {
          where: { student_id: string; statut: { _type: string } };
          skip: number;
          take: number;
          order: object;
          relations: object;
        },
      ];
      expect(options.where.student_id).toBe(STUDENT_ID);
      expect(options.where.statut._type).toBe('not');
      expect(options.skip).toBe(10);
      expect(options.take).toBe(10);
      expect(options.order).toEqual({ dte_creation: 'DESC' });
      expect(options.relations).toEqual({ company: true });

      expect(result.donnees).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 2,
        limite: 10,
        total: 25,
        totalPages: 3,
        aSuivante: true,
        aPrecedente: true,
      });
    });

    it('renvoie une page vide quand il n’y a aucune évaluation', async () => {
      evalRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByStudent(STUDENT_ID, {
        page: 1,
        limite: 10,
      } as PaginationDto);

      expect(result.donnees).toEqual([]);
      expect(result.meta).toEqual(
        expect.objectContaining({
          total: 0,
          totalPages: 0,
          aSuivante: false,
          aPrecedente: false,
        }),
      );
    });
  });

  describe('recalcul de star_rate', () => {
    async function recalcViaRemove() {
      manager.findOne.mockResolvedValue(makeEvaluation());
      await service.remove(COMPANY_ID, 'eval-1', USER);
      return manager.update.mock.calls[1] as [
        unknown,
        unknown,
        { star_rate: number },
      ];
    }

    it('met 0 quand la requête ne renvoie aucune ligne', async () => {
      await setup(null);
      const [, , values] = await recalcViaRemove();
      expect(values.star_rate).toBe(0);
    });

    it("met 0 quand l'étudiant n'a plus aucune évaluation active", async () => {
      await setup('0');
      const [, , values] = await recalcViaRemove();
      expect(values.star_rate).toBe(0);
    });

    it('exclut les évaluations supprimées du calcul', async () => {
      await recalcViaRemove();

      expect(manager.qb.andWhere).toHaveBeenCalledWith(
        'e.statut <> :supprime',
        { supprime: Statut.SUPPRIME },
      );
    });
  });
});
