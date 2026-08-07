// test/unit/company/company.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { User } from '../user/user.entity';
import { CreateCompanyDto } from './company.dto';
import { Statut } from '../common/enum/statut.enum';
import { AccountCreationService } from '../common/services/account-creation.service';

interface MockCompanyRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

interface MockAccountCreationService {
  checkEmailAvailable: jest.Mock;
  findRoleOrFail: jest.Mock;
  createUserWithActivation: jest.Mock;
}

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepository: MockCompanyRepository;
  let accountCreationService: MockAccountCreationService;

  const mockCurrentUser = { id: 'user-1', name: 'Admin User' };

  const mockCreateDto: CreateCompanyDto = {
    nom: 'Tech Corp',
    prenom: 'Jean',
    email: 'jean@techcorp.com',
    country_code: 'FR',
  };

  const mockRole = { id: 'role-1', nom: 'rh' };

  const mockUser: Partial<User> = {
    id: 'user-2',
    email: 'jean@techcorp.com',
    nom: 'Tech Corp',
    prenom: 'Jean',
    statut: Statut.EN_ATTENTE_ACTIVATION,
  };

  const mockCompany: Partial<Company> = {
    id: 'company-1',
    user_id: 'user-2',
    country_code: 'FR',
    statut: Statut.ACTIF,
    user: mockUser as User,
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

    accountCreationService = {
      checkEmailAvailable: jest.fn().mockResolvedValue(undefined),
      findRoleOrFail: jest.fn().mockResolvedValue(mockRole),
      createUserWithActivation: jest.fn().mockResolvedValue({
        user: mockUser,
        entity: mockCompany,
        rawToken: 'raw-activation-token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: companyRepository,
        },
        {
          provide: AccountCreationService,
          useValue: accountCreationService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create a company successfully', async () => {
      // Act
      const result = await service.create(mockCreateDto, mockCurrentUser);

      // Assert
      expect(accountCreationService.checkEmailAvailable).toHaveBeenCalledWith(
        mockCreateDto.email,
        'Company',
      );
      expect(accountCreationService.findRoleOrFail).toHaveBeenCalledWith(
        'rh',
        expect.any(String),
      );
      expect(
        accountCreationService.createUserWithActivation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockCreateDto.email,
          nom: mockCreateDto.nom,
          prenom: mockCreateDto.prenom,
          roleId: mockRole.id,
          createdBy: mockCurrentUser.id,
          contextEntity: 'Company',
        }),
        expect.any(Function),
      );
      expect(result).toEqual({ user: mockUser, company: mockCompany });
    });

    it('should invoke the business-entity factory with the correct Company payload', async () => {
      // Act
      await service.create(mockCreateDto, mockCurrentUser);

      // Assert : on récupère le callback passé à createUserWithActivation
      // et on vérifie qu'il crée bien la Company avec les bons champs.
      const [, createBusinessEntity] = accountCreationService
        .createUserWithActivation.mock.calls[0] as [
        unknown,
        (manager: unknown, savedUser: User) => Promise<Company>,
      ];

      const managerCreate = jest
        .fn()
        .mockImplementation((_entity: unknown, data: Partial<Company>) => data);
      const managerSave = jest.fn().mockResolvedValue(mockCompany);
      const fakeManager = { create: managerCreate, save: managerSave };

      await createBusinessEntity(fakeManager, mockUser as User);

      expect(managerCreate).toHaveBeenCalledWith(
        Company,
        expect.objectContaining({
          user_id: mockUser.id,
          country_code: mockCreateDto.country_code,
          statut: Statut.ACTIF,
          create_by: mockCurrentUser.id,
        }),
      );
      expect(managerSave).toHaveBeenCalled();
    });

    it('should propagate the error when the email already exists', async () => {
      // Arrange
      const error = new Error(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
      accountCreationService.checkEmailAvailable.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
      expect(
        accountCreationService.createUserWithActivation,
      ).not.toHaveBeenCalled();
    });

    it('should propagate the error when the role does not exist', async () => {
      // Arrange
      accountCreationService.findRoleOrFail.mockRejectedValue(
        new Error('Le rôle "rh" n\'existe pas'),
      );

      // Act & Assert
      await expect(
        service.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow('Le rôle "rh" n\'existe pas');
      expect(
        accountCreationService.createUserWithActivation,
      ).not.toHaveBeenCalled();
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
      ).rejects.toThrow('Company #invalid-id not found');
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    const removeCurrentUser = { id: 'user-1', email: 'admin@test.com' };

    it('should soft delete a company successfully', async () => {
      // Arrange
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
