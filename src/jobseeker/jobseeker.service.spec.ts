// jobseeker/jobseeker.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JobseekerService } from './jobseeker.service';
import { Jobseeker } from './jobseeker.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Statut } from '../common/enum/statut.enum';
import { PaginationDto } from '../common/pagination';

const STUDENT_ID = 'student-1';
const USER = { id: 'user-1' };
const anyDate: unknown = expect.any(Date);

type UpdateValues = Record<string, unknown>;

function makeManager() {
  // Repository Etudiant renvoyé par manager.getRepository(Etudiant) :
  // c'est lui qui résout l'id étudiant à partir du userId (getStudentId).
  const etudiantRepo = {
    findOne: jest.fn().mockResolvedValue({ id: STUDENT_ID }),
  };
  return {
    etudiantRepo,
    getRepository: jest.fn().mockReturnValue(etudiantRepo),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn((entity: object) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

function makeJobseeker(overrides: Partial<Jobseeker> = {}): Jobseeker {
  return {
    id: 'js-1',
    studentId: STUDENT_ID,
    entreprise: 'MTN Cam',
    poste: 'DSI',
    is_jobless: false,
    statut: Statut.ACTIF,
    ...overrides,
  } as Jobseeker;
}

describe('JobseekerService', () => {
  let service: JobseekerService;
  let manager: ReturnType<typeof makeManager>;
  let dataSource: { transaction: jest.Mock; manager: unknown };
  let jobseekerRepo: { findOne: jest.Mock; findAndCount: jest.Mock };

  /** Simule les deux findOne du service : l'étudiant, puis la ligne jobseeker. */
  function givenFindOne(found: {
    etudiant?: object | null;
    jobseeker?: Jobseeker | null;
  }) {
    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Etudiant)
        return Promise.resolve(
          found.etudiant === undefined ? { id: STUDENT_ID } : found.etudiant,
        );
      if (entity === Jobseeker) return Promise.resolve(found.jobseeker ?? null);
      return Promise.resolve(null);
    });
  }

  beforeEach(async () => {
    manager = makeManager();
    jobseekerRepo = { findOne: jest.fn(), findAndCount: jest.fn() };
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
      // utilisé par getStudentId quand aucun manager n'est fourni
      manager,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobseekerService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Jobseeker), useValue: jobseekerRepo },
      ],
    }).compile();

    service = moduleRef.get(JobseekerService);
  });

  describe('activerDans', () => {
    it("lève NotFound si l'étudiant n'existe pas", async () => {
      givenFindOne({ etudiant: null });

      await expect(
        service.activerDans(
          manager as never,
          STUDENT_ID,
          { poste: 'DSI' },
          USER,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('crée la ligne jobseeker et passe is_job_seeker à true', async () => {
      givenFindOne({ jobseeker: null });

      const result = await service.activerDans(
        manager as never,
        STUDENT_ID,
        { entreprise: 'MTN Cam', poste: 'DSI', is_jobless: false },
        USER,
      );

      expect(manager.update).toHaveBeenCalledWith(
        Etudiant,
        { id: STUDENT_ID },
        { is_job_seeker: true },
      );
      expect(manager.create).toHaveBeenCalledWith(Jobseeker, {
        studentId: STUDENT_ID,
        entreprise: 'MTN Cam',
        poste: 'DSI',
        is_jobless: false,
        dte_creation: anyDate,
        create_by: USER.id,
      });
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({
          studentId: STUDENT_ID,
          entreprise: 'MTN Cam',
        }),
      );
    });

    it('applique les valeurs par défaut quand le dto est vide', async () => {
      givenFindOne({ jobseeker: null });

      await service.activerDans(manager as never, STUDENT_ID, {}, USER);

      expect(manager.create).toHaveBeenCalledWith(
        Jobseeker,
        expect.objectContaining({
          entreprise: null,
          poste: null,
          is_jobless: true,
        }),
      );
    });

    it('réactive la ligne existante au lieu de la recréer', async () => {
      const existant = makeJobseeker({ statut: Statut.SUPPRIME });
      const reactivee = makeJobseeker();
      givenFindOne({ jobseeker: existant });
      manager.findOneOrFail.mockResolvedValue(reactivee);

      const result = await service.activerDans(
        manager as never,
        STUDENT_ID,
        { poste: 'CTO' },
        USER,
      );

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();

      const [entity, where, values] = manager.update.mock.calls[1] as [
        unknown,
        unknown,
        UpdateValues,
      ];
      expect(entity).toBe(Jobseeker);
      expect(where).toEqual({ id: 'js-1' });
      expect(values).toEqual(
        expect.objectContaining({
          poste: 'CTO',
          statut: Statut.ACTIF,
          updated_by: USER.id,
        }),
      );
      // la date de suppression est effacée via du SQL brut
      expect((values.dte_suppression as () => string)()).toBe('NULL');
      expect(result).toBe(reactivee);
    });

    it('ne met à jour que les champs fournis', async () => {
      givenFindOne({ jobseeker: makeJobseeker() });
      manager.findOneOrFail.mockResolvedValue(makeJobseeker());

      await service.activerDans(
        manager as never,
        STUDENT_ID,
        { entreprise: 'Orange' },
        USER,
      );

      const [, , values] = manager.update.mock.calls[1] as [
        unknown,
        unknown,
        UpdateValues,
      ];
      expect(values.entreprise).toBe('Orange');
      expect(values).not.toHaveProperty('poste');
      expect(values).not.toHaveProperty('is_jobless');
    });

    it('applique is_jobless même quand il vaut false', async () => {
      givenFindOne({ jobseeker: makeJobseeker({ is_jobless: true }) });
      manager.findOneOrFail.mockResolvedValue(makeJobseeker());

      await service.activerDans(
        manager as never,
        STUDENT_ID,
        { is_jobless: false },
        USER,
      );

      const [, , values] = manager.update.mock.calls[1] as [
        unknown,
        unknown,
        UpdateValues,
      ];
      expect(values.is_jobless).toBe(false);
    });
  });

  describe('activer', () => {
    it('exécute activerDans dans une transaction', async () => {
      givenFindOne({ jobseeker: null });

      const result = await service.activer(USER, { poste: 'DSI' });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // l'id étudiant est résolu depuis le userId du token
      expect(manager.getRepository).toHaveBeenCalledWith(Etudiant);
      expect(manager.etudiantRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER.id } }),
      );
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ poste: 'DSI' }));
    });

    it("échoue sans rien écrire si l'utilisateur n'a pas de profil étudiant", async () => {
      manager.etudiantRepo.findOne.mockResolvedValue(null);
      givenFindOne({ jobseeker: null });

      // type d'exception volontairement non précisé : à adapter à
      // ce que getStudentId lève réellement (NotFound / Forbidden).
      await expect(service.activer(USER, { poste: 'DSI' })).rejects.toThrow();

      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('desactiverDans', () => {
    it("lève NotFound si l'étudiant n'existe pas", async () => {
      givenFindOne({ etudiant: null });

      await expect(
        service.desactiverDans(manager as never, STUDENT_ID, USER),
      ).rejects.toThrow(NotFoundException);

      expect(manager.update).not.toHaveBeenCalled();
    });

    it('passe is_job_seeker à false puis supprime logiquement la ligne', async () => {
      givenFindOne({});

      await service.desactiverDans(manager as never, STUDENT_ID, USER);

      expect(manager.update).toHaveBeenNthCalledWith(
        1,
        Etudiant,
        { id: STUDENT_ID },
        { is_job_seeker: false },
      );

      const [entity, where, values] = manager.update.mock.calls[1] as [
        unknown,
        { studentId: string; statut: { _type: string } },
        UpdateValues,
      ];
      expect(entity).toBe(Jobseeker);
      expect(where.studentId).toBe(STUDENT_ID);
      // on ne touche que les lignes pas encore supprimées
      expect(where.statut._type).toBe('not');
      expect(values).toEqual({
        statut: Statut.SUPPRIME,
        dte_suppression: anyDate,
        updated_by: USER.id,
      });
    });
  });

  describe('desactiver', () => {
    it('exécute desactiverDans dans une transaction', async () => {
      givenFindOne({});

      await service.desactiver(USER);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.getRepository).toHaveBeenCalledWith(Etudiant);
      expect(manager.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('findByStudent', () => {
    it('renvoie le profil actif de l’étudiant', async () => {
      const jobseeker = makeJobseeker();
      jobseekerRepo.findOne.mockResolvedValue(jobseeker);

      const result = await service.findByStudent(STUDENT_ID);

      const [options] = jobseekerRepo.findOne.mock.calls[0] as [
        { where: { studentId: string; statut: { _type: string } } },
      ];
      expect(options.where.studentId).toBe(STUDENT_ID);
      expect(options.where.statut._type).toBe('not');
      expect(result).toBe(jobseeker);
    });

    it("lève NotFound si l'étudiant n'est pas en recherche d'emploi", async () => {
      jobseekerRepo.findOne.mockResolvedValue(null);

      await expect(service.findByStudent(STUDENT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('pagine et exclut les profils supprimés', async () => {
      jobseekerRepo.findAndCount.mockResolvedValue([[makeJobseeker()], 25]);
      const pagination = { page: 2, limite: 10 } as PaginationDto;

      const result = await service.findAll(pagination);

      const [options] = jobseekerRepo.findAndCount.mock.calls[0] as [
        {
          where: { statut: { _type: string } };
          relations: object;
          order: object;
          skip: number;
          take: number;
        },
      ];
      expect(options.where.statut._type).toBe('not');
      expect(options.relations).toEqual({ etudiant: { user: true } });
      expect(options.order).toEqual({ dte_creation: 'DESC' });
      expect(options.skip).toBe(10);
      expect(options.take).toBe(10);

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

    it('renvoie une page vide quand personne ne cherche', async () => {
      jobseekerRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({
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
});
