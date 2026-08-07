// test/unit/company/company.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { CreateCompanyDto } from './company.dto';
import { Statut } from '../common/enum/statut.enum';
import { Roles } from '../common/enum/roles.enum';
import { ActivationTokenService } from '../common/services/activation-token.service';
import { MailService } from '../mail/mail.service';

jest.mock('bcrypt');

interface MockCompanyRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

interface MockUserRepository {
  findOne: jest.Mock;
  update: jest.Mock;
}

interface MockRoleRepository {
  findOne: jest.Mock;
}

interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
}

interface MockQueryRunner {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: MockEntityManager;
}

interface MockDataSource {
  createQueryRunner: jest.Mock;
}

interface MockActivationTokenService {
  createAndSave: jest.Mock;
  buildActivationLink: jest.Mock;
}

interface MockMailService {
  sendAccountActivationMail: jest.Mock;
}

// Forme minimale utilisée par manager.save pour distinguer user vs company
type SavedEntity = Partial<User> & Partial<Company> & { email?: string };

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepository: MockCompanyRepository;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;
  let dataSource: MockDataSource;
  let queryRunner: MockQueryRunner;
  let activationTokenService: MockActivationTokenService;
  let mailService: MockMailService;

  const mockRawToken = 'raw-activation-token';
  const mockActivationLink =
    'https://app.example.com/activate?token=raw-activation-token';

  const mockCurrentUser = { id: 'user-1', name: 'Admin User' };

  const mockCreateDto: CreateCompanyDto = {
    nom: 'Tech Corp',
    prenom: 'Jean',
    email: 'jean@techcorp.com',
    country_code: 'FR',
  };

  const mockRole = {
    id: 'role-1',
    nom: Roles.RH,
  };

  const mockUser = {
    id: 'user-1',
    email: 'jean@techcorp.com',
    nom: 'Tech Corp',
    prenom: 'Jean',
    password: 'hashed_password',
    statut: Statut.ACTIF,
  };

  const mockCompany = {
    id: 'company-1',
    user_id: 'user-1',
    country_code: 'FR',
    statut: Statut.ACTIF,
    user: mockUser,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    companyRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockImplementation((data: unknown) => data),
    };

    userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    };

    roleRepository = {
      findOne: jest.fn().mockResolvedValue(mockRole),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest
          .fn()
          .mockImplementation((_entity: unknown, data: unknown) => data),
        save: jest.fn().mockImplementation((entity: SavedEntity) => {
          if (entity.email) {
            return Promise.resolve({ ...mockUser, ...entity });
          }
          return Promise.resolve({ ...mockCompany, ...entity });
        }),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    activationTokenService = {
      createAndSave: jest.fn().mockResolvedValue(mockRawToken),
      buildActivationLink: jest.fn().mockReturnValue(mockActivationLink),
    };

    mailService = {
      sendAccountActivationMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: companyRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: ActivationTokenService,
          useValue: activationTokenService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create a company successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);
      // Act
      const result = await service.create(mockCreateDto, mockCurrentUser);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('company');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(activationTokenService.createAndSave).toHaveBeenCalledWith(
        expect.any(String),
        queryRunner.manager,
      );
      expect(activationTokenService.buildActivationLink).toHaveBeenCalledWith(
        mockRawToken,
      );
      expect(mailService.sendAccountActivationMail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        mockActivationLink,
      );
    });

    it('should not throw when activation email sending fails', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);
      mailService.sendAccountActivationMail.mockRejectedValue(
        new Error('SMTP unreachable'),
      );

      // Act
      const result = await service.create(mockCreateDto, mockCurrentUser);

      // Assert : la création réussit malgré l'échec d'envoi d'email
      expect(result).toHaveProperty('user');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BusinessConflictException when email already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should throw BusinessConflictException when role does not exist', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow('Le rôle "rh" n\'existe pas');
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all companies with user relations', async () => {
      // Arrange
      const expectedCompanies = [mockCompany];
      companyRepository.find.mockResolvedValue(expectedCompanies);

      // Act
      const result = await service.findAll();

      // Assert
      expect(companyRepository.find).toHaveBeenCalledWith({
        relations: { user: true },
      });
      expect(result).toEqual(expectedCompanies);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a company by ID', async () => {
      // Arrange
      companyRepository.findOne.mockResolvedValue(mockCompany);

      // Act
      const result = await service.findOne('company-1');

      // Assert
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        relations: { user: true },
      });
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      // Arrange
      companyRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Entreprises #invalid-id introuvable',
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    const updateCurrentUser = { id: 'user-1', email: 'admin@test.com' };

    it('should update a company successfully', async () => {
      // Arrange
      companyRepository.findOne.mockResolvedValue(mockCompany);
      companyRepository.update.mockResolvedValue({ affected: 1 });
      companyRepository.findOne.mockResolvedValueOnce({
        ...mockCompany,
        country_code: 'BE',
      });

      // Act
      const result = await service.update(
        'company-1',
        { country_code: 'BE' },
        updateCurrentUser,
      );

      // Assert
      expect(result).toBeDefined();
      expect(companyRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company does not exist', async () => {
      // Arrange
      companyRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('invalid-id', { country_code: 'BE' }, updateCurrentUser),
      ).rejects.toThrow("Company avec l'ID invalid-id n'existe pas");
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    const removeCurrentUser = { id: 'user-1', email: 'admin@test.com' };

    it('should soft delete a company successfully', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockCompany as unknown as Company);
      companyRepository.save.mockResolvedValue({
        ...mockCompany,
        statut: Statut.SUPPRIME,
      });

      // Act
      await service.remove('company-1', removeCurrentUser);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith('company-1');
      expect(companyRepository.save).toHaveBeenCalled();
    });
  });
});
