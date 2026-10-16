import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import EtudiantService from './etudiant.service';
import { Etudiant } from './etudiant.entity';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { Statut } from '../common/enum/statut.enum';
import { CreateEtudiantDto, UpdateEtudiantDto } from './dto/etudiant.dto';
import { buildEtudiant } from '../../test/factories/etudiant.factory';
import { buildUser } from '../../test/factories/user.factory';
import { ActivationTokenService } from '../common/services/activation-token.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';
import { LinkCheckerService } from '../common/services/link-checker.service';
import { JobseekerService } from '../jobseeker/jobseeker.service';

describe('EtudiantService', () => {
  let service: EtudiantService;

  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindOne = jest.fn();
  const mockUpdate = jest.fn();

  const mockEtudiantRepo = {
    find: mockFind,
    findOne: mockFindOne,
    save: mockSave,
    update: mockUpdate,
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn(),
  };

  const mockQueryRunnerManager = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockQueryRunnerManager,
  };

  // Manager passé au callback de dataSource.transaction (utilisé par update)
  const mockManager = {
    update: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    transaction: jest.fn((cb: (manager: unknown) => unknown) =>
      cb(mockManager),
    ),
  };

  const mockActivationTokenService = {
    createAndSave: jest.fn(),
    buildActivationLink: jest.fn(),
  };

  const mockMailService = {
    sendAccountActivationMail: jest.fn(),
  };

  const mockJobseekerService = {
    activerDans: jest.fn(),
    desactiverDans: jest.fn(),
  };

  const mockUser = buildUser();
  const mockEtudiant = buildEtudiant();
  const mockLinkCheckerService = {
    validateLinksOrThrow: jest.fn(),
  };

  const currentUser = { id: 'admin-1', email: 'admin@example.com' };

  function setupSuccessfulCreationMocks() {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockRoleRepo.findOne.mockResolvedValue({
      id: 'role-etudiant-1',
      nom: 'etudiant',
    });
    mockLinkCheckerService.validateLinksOrThrow.mockResolvedValue(undefined);
    mockQueryRunnerManager.create
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockEtudiant);
    mockQueryRunnerManager.save
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockEtudiant);
    mockActivationTokenService.createAndSave.mockResolvedValue('raw-token-123');
    mockActivationTokenService.buildActivationLink.mockReturnValue(
      'https://front.test/activation?token=raw-token-123',
    );
  }

  /** Prépare un étudiant renvoyé par findOne (avant et après la mise à jour). */
  function givenEtudiant(overrides: Partial<Etudiant> = {}) {
    const etudiant = buildEtudiant(overrides);
    mockFindOne.mockResolvedValue(etudiant);
    return etudiant;
  }

  beforeEach(async () => {
    // Évite qu'une valeur "once" non consommée dans un test fuite dans le suivant
    mockFindOne.mockReset();
    mockJobseekerService.activerDans.mockReset();
    mockJobseekerService.desactiverDans.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtudiantService,
        {
          provide: getRepositoryToken(Etudiant),
          useValue: mockEtudiantRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: ActivationTokenService,
          useValue: mockActivationTokenService,
        },
        { provide: MailService, useValue: mockMailService },
        { provide: LinkCheckerService, useValue: mockLinkCheckerService },
        { provide: JobseekerService, useValue: mockJobseekerService },
      ],
    }).compile();

    service = module.get<EtudiantService>(EtudiantService);
  });

  afterEach(() => jest.clearAllMocks());

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateEtudiantDto = {
      email: 'nouveau@example.com',
      nom: 'Doe',
      prenom: 'John',
      matricule: 'MAT-2026-001',
      promotionId: 'prom-1',
      annee_acad: '2026-2027',
    };

    it('devrait créer et sauvegarder un étudiant avec succès', async () => {
      setupSuccessfulCreationMocks();
      mockMailService.sendAccountActivationMail.mockResolvedValue(undefined);

      const result = await service.create(dto, currentUser);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email.toLowerCase().trim() },
      });
      expect(mockRoleRepo.findOne).toHaveBeenCalledWith({
        where: { nom: 'etudiant' },
      });
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledWith();
      expect(mockActivationTokenService.createAndSave).toHaveBeenCalledWith(
        mockUser.id,
        mockQueryRunnerManager,
      );
      expect(result).toEqual({
        user: mockUser,
        etudiant: mockEtudiant,
      });
    });

    it("devrait lever une exception si l'email existe déjà", async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.create(dto, currentUser)).rejects.toThrow();

      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
    });

    it('devrait lever une exception si le rôle "etudiant" n\'existe pas', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, currentUser)).rejects.toThrow();
    });

    it("devrait rollback la transaction en cas d'erreur DB", async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockReturnValue({
        id: 'role-etudiant-1',
        nom: 'etudiant',
      });
      mockQueryRunnerManager.create.mockReturnValue(mockUser);
      mockQueryRunnerManager.save.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto, currentUser)).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it("ne devrait pas faire échouer la création si l'envoi d'email échoue", async () => {
      setupSuccessfulCreationMocks();
      mockMailService.sendAccountActivationMail.mockRejectedValue(
        new Error('SMTP down'),
      );

      const result = await service.create(dto, currentUser);

      expect(result).toEqual({ user: mockUser, etudiant: mockEtudiant });
    });
    describe('create — validation des liens', () => {
      it('devrait appeler validateLinksOrThrow si dto.liens est fourni', async () => {
        setupSuccessfulCreationMocks();
        mockMailService.sendAccountActivationMail.mockResolvedValue(undefined);

        const dtoAvecLiens: CreateEtudiantDto = {
          ...dto,
          liens: { github: 'https://github.com/johndoe' },
        };

        await service.create(dtoAvecLiens, currentUser);

        expect(
          mockLinkCheckerService.validateLinksOrThrow,
        ).toHaveBeenCalledWith(dtoAvecLiens.liens);
      });

      it('ne devrait pas appeler validateLinksOrThrow si dto.liens est absent', async () => {
        setupSuccessfulCreationMocks();
        mockMailService.sendAccountActivationMail.mockResolvedValue(undefined);

        await service.create(dto, currentUser); // dto sans "liens"

        expect(
          mockLinkCheckerService.validateLinksOrThrow,
        ).not.toHaveBeenCalled();
      });

      it('devrait rejeter la création si un lien est inaccessible, sans ouvrir de transaction DB', async () => {
        mockUserRepo.findOne.mockResolvedValue(null);
        mockRoleRepo.findOne.mockResolvedValue({
          id: 'role-etudiant-1',
          nom: 'etudiant',
        });
        mockLinkCheckerService.validateLinksOrThrow.mockRejectedValue(
          new Error('Lien(s) inaccessible(s) : github (https://site-down.com)'),
        );

        const dtoAvecLiens: CreateEtudiantDto = {
          ...dto,
          liens: { github: 'https://site-down.com' },
        };

        await expect(service.create(dtoAvecLiens, currentUser)).rejects.toThrow(
          'Lien(s) inaccessible(s)',
        );

        expect(mockQueryRunner.connect).not.toHaveBeenCalled();
      });
    });

    describe('create — recherche d’emploi', () => {
      function setupCreationWithSavedEtudiant(
        etudiant: ReturnType<typeof buildEtudiant>,
      ) {
        setupSuccessfulCreationMocks();
        mockMailService.sendAccountActivationMail.mockResolvedValue(undefined);
        // on remplace l'étudiant renvoyé par le save de la transaction
        mockQueryRunnerManager.save.mockReset();
        mockQueryRunnerManager.save
          .mockResolvedValueOnce(mockUser)
          .mockResolvedValueOnce(etudiant);
      }

      it('active la recherche d’emploi dans la même transaction quand is_job_seeker est true', async () => {
        const enRecherche = buildEtudiant({ is_job_seeker: true });
        setupCreationWithSavedEtudiant(enRecherche);

        await service.create({ ...dto, is_job_seeker: true }, currentUser);

        expect(mockJobseekerService.activerDans).toHaveBeenCalledWith(
          mockQueryRunnerManager,
          enRecherche.id,
          {},
          currentUser,
        );
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });

      it('transmet les détails jobseeker du dto', async () => {
        const enRecherche = buildEtudiant({ is_job_seeker: true });
        setupCreationWithSavedEtudiant(enRecherche);
        const jobseeker = { entreprise: 'MTN Cam', poste: 'DSI' };

        await service.create(
          { ...dto, is_job_seeker: true, jobseeker },
          currentUser,
        );

        expect(mockJobseekerService.activerDans).toHaveBeenCalledWith(
          mockQueryRunnerManager,
          enRecherche.id,
          jobseeker,
          currentUser,
        );
      });

      it("n'active rien quand is_job_seeker est false", async () => {
        setupCreationWithSavedEtudiant(buildEtudiant({ is_job_seeker: false }));

        await service.create(dto, currentUser);

        expect(mockJobseekerService.activerDans).not.toHaveBeenCalled();
      });

      it('rollback la création si l’activation échoue', async () => {
        setupCreationWithSavedEtudiant(buildEtudiant({ is_job_seeker: true }));
        mockJobseekerService.activerDans.mockRejectedValueOnce(
          new Error('boom'),
        );

        await expect(
          service.create({ ...dto, is_job_seeker: true }, currentUser),
        ).rejects.toThrow();

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      });
    });
  });
  describe('findAll', () => {
    it('devrait retourner tous les étudiants', async () => {
      mockFind.mockResolvedValue([mockEtudiant]);

      const result = await service.findAll();

      expect(mockFind).toHaveBeenCalledWith({ relations: { user: true } });
      expect(result).toEqual([mockEtudiant]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un étudiant existant', async () => {
      mockFindOne.mockResolvedValue(mockEtudiant);

      const result = await service.findOne('etu-1');

      expect(mockFindOne).toHaveBeenCalledWith({
        where: { id: 'etu-1' },
        relations: { user: true, jobseeker: true },
      });
      expect(result).toEqual(mockEtudiant);
    });

    it("devrait lever une NotFoundException si l'étudiant n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('inconnu')).rejects.toThrow(
        'Etudiant #inconnu introuvable',
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un etudiant existante', async () => {
      const dto: UpdateEtudiantDto = {
        statut: Statut.INACTIF,
      };
      const updated = buildEtudiant({ statut: Statut.INACTIF });

      mockFindOne
        .mockResolvedValueOnce(mockEtudiant)
        .mockResolvedValueOnce(updated);

      const result = await service.update('etu-1', dto, currentUser);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.update).toHaveBeenCalledWith(
        Etudiant,
        'etu-1',
        expect.objectContaining({
          ...dto,
          updated_by: currentUser.id,
        }),
      );
      expect(result).toEqual(updated);
    });

    it("devrait lever une NotFoundException si l'etudiant à mettre à jour n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.update('inconnu', {}, currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(mockManager.update).not.toHaveBeenCalled();
    });

    it("met à jour le nom et le prénom de l'utilisateur dans la transaction", async () => {
      givenEtudiant({ user: mockUser });

      await service.update('etu-1', { nom: 'Nouveau' }, currentUser);

      expect(mockManager.update).toHaveBeenCalledWith(User, mockUser.id, {
        nom: 'Nouveau',
      });
    });

    describe('update — recherche d’emploi', () => {
      it("n'écrit pas is_job_seeker via la mise à jour générique", async () => {
        givenEtudiant({ is_job_seeker: false });

        await service.update('etu-1', { is_job_seeker: true }, currentUser);

        const [entity, , values] = mockManager.update.mock.calls[0] as [
          unknown,
          unknown,
          Record<string, unknown>,
        ];
        expect(entity).toBe(Etudiant);
        // c'est JobseekerService qui écrit le flag, pour rester cohérent avec la table
        expect(values).not.toHaveProperty('is_job_seeker');
        expect(values).not.toHaveProperty('jobseeker');
      });

      it('active la recherche quand is_job_seeker passe à true', async () => {
        givenEtudiant({ is_job_seeker: false });

        await service.update('etu-1', { is_job_seeker: true }, currentUser);

        expect(mockJobseekerService.activerDans).toHaveBeenCalledWith(
          mockManager,
          'etu-1',
          {},
          currentUser,
        );
        expect(mockJobseekerService.desactiverDans).not.toHaveBeenCalled();
      });

      it('transmet les détails jobseeker lors du passage à true', async () => {
        givenEtudiant({ is_job_seeker: false });
        const jobseeker = { entreprise: 'MTN Cam', poste: 'DSI' };

        await service.update(
          'etu-1',
          { is_job_seeker: true, jobseeker },
          currentUser,
        );

        expect(mockJobseekerService.activerDans).toHaveBeenCalledWith(
          mockManager,
          'etu-1',
          jobseeker,
          currentUser,
        );
      });

      it('désactive la recherche quand is_job_seeker passe à false', async () => {
        givenEtudiant({ is_job_seeker: true });

        await service.update('etu-1', { is_job_seeker: false }, currentUser);

        expect(mockJobseekerService.desactiverDans).toHaveBeenCalledWith(
          mockManager,
          'etu-1',
          currentUser,
        );
        expect(mockJobseekerService.activerDans).not.toHaveBeenCalled();
      });

      it("ne désactive rien si l'étudiant n'était pas en recherche", async () => {
        givenEtudiant({ is_job_seeker: false });

        await service.update('etu-1', { is_job_seeker: false }, currentUser);

        expect(mockJobseekerService.desactiverDans).not.toHaveBeenCalled();
        expect(mockJobseekerService.activerDans).not.toHaveBeenCalled();
      });

      it("met à jour les détails d'un étudiant déjà en recherche", async () => {
        givenEtudiant({ is_job_seeker: true });
        const jobseeker = { poste: 'CTO' };

        await service.update('etu-1', { jobseeker }, currentUser);

        expect(mockJobseekerService.activerDans).toHaveBeenCalledWith(
          mockManager,
          'etu-1',
          jobseeker,
          currentUser,
        );
      });

      it("ignore les détails jobseeker d'un étudiant qui ne cherche pas", async () => {
        givenEtudiant({ is_job_seeker: false });

        await service.update(
          'etu-1',
          { jobseeker: { poste: 'CTO' } },
          currentUser,
        );

        expect(mockJobseekerService.activerDans).not.toHaveBeenCalled();
        expect(mockJobseekerService.desactiverDans).not.toHaveBeenCalled();
      });

      it("ne touche pas à la recherche d'emploi quand le dto n'en parle pas", async () => {
        givenEtudiant({ is_job_seeker: true });

        await service.update('etu-1', { statut: Statut.INACTIF }, currentUser);

        expect(mockJobseekerService.activerDans).not.toHaveBeenCalled();
        expect(mockJobseekerService.desactiverDans).not.toHaveBeenCalled();
      });
    });
  });

  describe('remove', () => {
    it('devrait faire un soft delete (statut SUPPRIME + date de suppression)', async () => {
      mockFindOne.mockResolvedValue(buildEtudiant());
      mockSave.mockResolvedValue(mockEtudiant);

      await service.remove('etu-1', currentUser);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: Statut.SUPPRIME,
          dte_suppression: expect.any(Date) as Date,
        }),
      );
    });

    it("devrait lever une NotFoundException si l'etudiant à supprimer n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.remove('inconnu', currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
