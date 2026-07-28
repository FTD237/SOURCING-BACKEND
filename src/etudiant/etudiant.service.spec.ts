import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EtudiantService } from './etudiant.service';
import { Etudiant } from './etudiant.entity';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { Statut } from '../common/enum/statut.enum';
import { CreateEtudiantDto, UpdateEtudiantDto } from './etudiant.dto';
import { buildEtudiant } from '../../test/factories/etudiant.factory';
import { buildUser } from '../../test/factories/user.factory';
import { ActivationTokenService } from '../common/services/activation-token.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';

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

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockActivationTokenService = {
    createAndSave: jest.fn(),
    buildActivationLink: jest.fn(),
  };

  const mockMailService = {
    sendAccountActivationMail: jest.fn(),
  };

  const mockUser = buildUser();
  const mockEtudiant = buildEtudiant();

  const currentUser = { id: 'admin-1', email: 'admin@example.com' };

  function setupSuccessfulCreationMocks() {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockRoleRepo.findOne.mockResolvedValue({
      id: 'role-etudiant-1',
      nom: 'etudiant',
    });
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

  beforeEach(async () => {
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
        relations: { user: true },
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

      expect(mockUpdate).toHaveBeenCalledWith(
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
      expect(mockUpdate).not.toHaveBeenCalled();
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
