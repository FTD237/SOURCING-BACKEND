// test/unit/company/company.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { CompanyService } from './company.service';
import Company from './company.entity';
import { User } from '../user/user.entity';
import { CreateCompanyDto } from './dto/company.dto';
import { RechercheCompanyDto } from './dto/recherche.company.dto';
import { Statut } from '../common/enum/statut.enum';
import { AccountCreationService } from '../common/services/account-creation.service';
import { RecruitmentStatusEnum } from '../common/enum/recruitment-status.enum';
import { Roles as RolesEnum } from '../common/enum/roles.enum';

interface MockCompanyRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
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

  const mockCurrentUser = { id: 'user-1', email: 'Admin User' };

  const mockCreateDto: CreateCompanyDto = {
    nom: 'Tech Corp',
    prenom: 'Jean',
    email: 'jean@techcorp.com',
    country_code: 'FR',
    company_name: 'techCorp',
    company_description: 'Description de test',
    contact_person: 'Sergine',
    contact_phone: 677789090,
    recruitment_status: RecruitmentStatusEnum.RECRUITING,
    localisation: {
      latitude: 3.89098,
      longitude: 4.2345,
      nom: 'techCorp',
      city: 'Douala',
      address: 'Douala rue de la joie',
    },
    isPartner: false,
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

  // ✅ Mock du QueryBuilder pour findAll
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    companyRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockImplementation((data: unknown) => data),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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
      const result = await service.create(mockCreateDto, mockCurrentUser);

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
      await service.create(mockCreateDto, mockCurrentUser);

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
      const error = new Error(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
      accountCreationService.checkEmailAvailable.mockRejectedValue(error);

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
      accountCreationService.findRoleOrFail.mockRejectedValue(
        new Error('Le rôle "rh" n\'existe pas'),
      );

      await expect(
        service.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow('Le rôle "rh" n\'existe pas');
      expect(
        accountCreationService.createUserWithActivation,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // findAll() — filtre + pagination
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    /**
     * Construit un vrai RechercheCompanyDto (valeurs par défaut et getters
     * de PaginationDto inclus, comme en production) : un simple objet
     * { page, limite } ne satisfait pas le type (ordre, sauter manquants).
     */
    const filtre = (
      overrides: Partial<RechercheCompanyDto> = {},
    ): RechercheCompanyDto =>
      plainToInstance(RechercheCompanyDto, {
        page: 1,
        limite: 10,
        ...overrides,
      });

    const mockCurrentUserFindAll = {
      id: 'user-1',
      email: 'admin@test.com',
      role: RolesEnum.ADMIN,
    };

    it('should return paginated companies', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockCompany], 1]);

      // Act
      const result = await service.findAll(filtre(), mockCurrentUserFindAll);

      // Assert
      expect(companyRepository.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result.donnees).toEqual([mockCompany]);
      expect(result.meta.total).toBe(1);
    });

    it('should apply pagination skip and take', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 25]);

      // Act
      await service.findAll(filtre({ page: 3 }), mockCurrentUserFindAll);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should exclude deleted companies by default', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll(filtre(), mockCurrentUserFindAll);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.statut <> :supprime',
        { supprime: Statut.SUPPRIME },
      );
    });

    it('should filter by statut when provided', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll(
        filtre({ statut: Statut.ACTIF }),
        mockCurrentUserFindAll,
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.statut = :statut',
        { statut: Statut.ACTIF },
      );
    });

    it('should filter by id, userId and country_code', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll(
        filtre({ id: 'company-1', userId: 'user-1', country_code: 'FR' }),
        mockCurrentUserFindAll,
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('c.id = :id', {
        id: 'company-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.user_id = :userId',
        { userId: 'user-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.country_code = :country_code',
        { country_code: 'FR' },
      );
    });

    it('should filter by isPartner and recruitment_status', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll(
        filtre({
          isPartner: true,
          recruitment_status: RecruitmentStatusEnum.RECRUITING,
        }),
        mockCurrentUserFindAll,
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.isPartner = :isPartner',
        { isPartner: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.recruitment_status = :recruitment_status',
        { recruitment_status: RecruitmentStatusEnum.RECRUITING },
      );
    });

    it('should throw ForbiddenException when non-admin tries to see deleted companies', async () => {
      // Arrange
      const regularUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: RolesEnum.ETUDIANT,
      };

      // Act & Assert
      await expect(
        service.findAll(filtre({ inclureSupprimes: true }), regularUser),
      ).rejects.toThrow();
      expect(companyRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should allow admin to see deleted companies', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll(
        filtre({ inclureSupprimes: true }),
        mockCurrentUserFindAll,
      );

      // Assert
      expect(companyRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a company by ID', async () => {
      companyRepository.findOne.mockResolvedValue(mockCompany);

      const result = await service.findOne('company-1');

      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        relations: { user: true },
      });
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        "Company avec l'ID invalid-id n'existe pas",
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    const updateCurrentUser = { id: 'user-1', email: 'admin@test.com' };

    it('should update a company successfully', async () => {
      companyRepository.findOne.mockResolvedValue(mockCompany);
      companyRepository.update.mockResolvedValue({ affected: 1 });
      companyRepository.findOne.mockResolvedValueOnce({
        ...mockCompany,
        country_code: 'BE',
      });

      const result = await service.update(
        'company-1',
        { country_code: 'BE' },
        updateCurrentUser,
      );

      expect(result).toBeDefined();
      expect(companyRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepository.findOne.mockResolvedValue(null);

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

      await service.remove('company-1', removeCurrentUser);

      expect(findOneSpy).toHaveBeenCalledWith('company-1');
      expect(companyRepository.save).toHaveBeenCalled();
    });
  });
});
