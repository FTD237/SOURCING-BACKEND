// test/unit/company/company.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './dto/company.dto';
import { RechercheCompanyDto } from './dto/recherche.company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { User } from '../user/user.entity';
import Company from './company.entity';
import { Statut } from '../common/enum/statut.enum';
import { RecruitmentStatusEnum } from '../common/enum/recruitment-status.enum';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { ResultatPagine } from '../common/pagination';
import { NiveauEtudeEnum } from '../common/enum/niveau-etude.enum';

describe('CompanyController', () => {
  let controller: CompanyController;

  const mockCurrentUser = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: RolesEnum.ADMIN,
  };

  const mockCreateDto: CreateCompanyDto = {
    minStudentLevel: NiveauEtudeEnum.FOURTH_YEAR,
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

  const mockUpdateDto: UpdateCompanyDto = {
    nom: 'Tech Corp Updated',
    prenom: 'Jean-Pierre',
    country_code: 'BE',
  };

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'jean@techcorp.com',
    nom: 'Tech Corp',
    prenom: 'Jean',
  };

  const mockCompany: Partial<Company> = {
    id: 'company-1',
    user_id: 'user-1',
    country_code: 'FR',
    statut: Statut.ACTIF,
  };

  const mockCompanyResponse = {
    user: mockUser,
    company: mockCompany,
    generatedPassword: 'GeneratedPass123!',
  };

  const mockCompanyWithUser = {
    ...mockCompany,
    user: mockUser,
  };

  // ✅ Mock du résultat paginé pour findAll
  const mockPaginatedResult: ResultatPagine<Company> = {
    donnees: [mockCompanyWithUser as Company],
    meta: {
      total: 1,
      page: 1,
      limite: 10,
      totalPages: 1,
      aSuivante: false,
      aPrecedente: false,
    },
  };

  let mockCreate: jest.MockedFunction<CompanyService['create']>;
  let mockFindAll: jest.MockedFunction<CompanyService['findAll']>;
  let mockFindOne: jest.MockedFunction<CompanyService['findOne']>;
  let mockUpdate: jest.MockedFunction<CompanyService['update']>;
  let mockRemove: jest.MockedFunction<CompanyService['remove']>;

  beforeEach(async () => {
    mockCreate = jest.fn();
    mockFindAll = jest.fn();
    mockFindOne = jest.fn();
    mockUpdate = jest.fn();
    mockRemove = jest.fn();

    const mockService = {
      create: mockCreate,
      findAll: mockFindAll,
      findOne: mockFindOne,
      update: mockUpdate,
      remove: mockRemove,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create a company and return the response', async () => {
      mockCreate.mockResolvedValue(
        mockCompanyResponse as unknown as CreateCompanyResponseDto,
      );

      const result = await controller.create(mockCreateDto, mockCurrentUser);

      expect(mockCreate).toHaveBeenCalledWith(mockCreateDto, mockCurrentUser);
      expect(result).toEqual(mockCompanyResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      const error = new Error(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
      mockCreate.mockRejectedValue(error);

      await expect(
        controller.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow(
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const error = new Error('Le rôle "rh" n\'existe pas');
      mockCreate.mockRejectedValue(error);

      await expect(
        controller.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow('Le rôle "rh" n\'existe pas');
    });
  });

  // -------------------------------------------------------------------------
  // findAll() — ✅ Nouvelle signature avec filtre + pagination
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated companies', async () => {
      // Arrange
      const filtre: RechercheCompanyDto = {
        ordre: 'DESC',
        get sauter(): number {
          return 0;
        },
        page: 1,
        limite: 10,
      };
      mockFindAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAll(filtre, mockCurrentUser);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(filtre, mockCurrentUser);
      expect(result).toEqual(mockPaginatedResult);
      expect(result.donnees).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should pass all filters to the service', async () => {
      // Arrange
      const filtre: RechercheCompanyDto = {
        ordre: 'DESC',
        get sauter(): number {
          return 0;
        },
        page: 2,
        limite: 5,
        q: 'tech',
        country_code: 'FR',
        isPartner: true,
        recruitment_status: RecruitmentStatusEnum.RECRUITING,
      };
      mockFindAll.mockResolvedValue({
        donnees: [],
        meta: {
          total: 0,
          page: 2,
          limite: 5,
          totalPages: 0,
          aSuivante: false,
          aPrecedente: false,
        },
      });

      // Act
      await controller.findAll(filtre, mockCurrentUser);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(filtre, mockCurrentUser);
    });

    it('should throw ForbiddenException when non-admin tries to see deleted companies', async () => {
      // Arrange
      const filtre: RechercheCompanyDto = {
        ordre: 'DESC',
        get sauter(): number {
          return 0;
        },
        page: 1,
        limite: 10,
        inclureSupprimes: true,
      };
      const regularUser = {
        id: 'user-2',
        email: 'user@test.com',
        role: RolesEnum.ETUDIANT,
      };
      mockFindAll.mockRejectedValue(new Error('Forbidden'));

      // Act & Assert
      await expect(controller.findAll(filtre, regularUser)).rejects.toThrow(
        'Forbidden',
      );
    });

    it('should return empty page when no companies exist', async () => {
      // Arrange
      const filtre: RechercheCompanyDto = {
        ordre: 'ASC',
        get sauter(): number {
          return 0;
        },
        page: 1,
        limite: 10,
      };
      mockFindAll.mockResolvedValue({
        donnees: [],
        meta: {
          total: 0,
          page: 1,
          limite: 10,
          totalPages: 0,
          aSuivante: false,
          aPrecedente: false,
        },
      });

      // Act
      const result = await controller.findAll(filtre, mockCurrentUser);

      // Assert
      expect(result.donnees).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a company by ID', async () => {
      const companyId = 'company-1';
      mockFindOne.mockResolvedValue(mockCompanyWithUser as unknown as Company);

      const result = await controller.findOne(companyId);

      expect(mockFindOne).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockCompanyWithUser);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      const companyId = 'invalid-id';
      mockFindOne.mockRejectedValue(
        new Error(`Entreprises #${companyId} introuvable`),
      );

      await expect(controller.findOne(companyId)).rejects.toThrow(
        `Entreprises #${companyId} introuvable`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('should update a company and return the updated entity', async () => {
      const companyId = 'company-1';
      const updatedCompany = { ...mockCompanyWithUser, country_code: 'BE' };
      mockUpdate.mockResolvedValue(updatedCompany as unknown as Company);

      const result = await controller.update(
        companyId,
        mockUpdateDto,
        mockCurrentUser,
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        companyId,
        mockUpdateDto,
        mockCurrentUser,
      );
      expect(result).toEqual(updatedCompany);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      const companyId = 'invalid-id';
      mockUpdate.mockRejectedValue(
        new Error(`Company #${companyId} not found`),
      );

      await expect(
        controller.update(companyId, mockUpdateDto, mockCurrentUser),
      ).rejects.toThrow(`Company #${companyId} not found`);
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete a company', async () => {
      const companyId = 'company-1';
      mockRemove.mockResolvedValue(undefined);

      const result = await controller.remove(companyId, mockCurrentUser);

      expect(mockRemove).toHaveBeenCalledWith(companyId, mockCurrentUser);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when company does not exist', async () => {
      const companyId = 'invalid-id';
      mockRemove.mockRejectedValue(
        new Error(`Company #${companyId} not found`),
      );

      await expect(
        controller.remove(companyId, mockCurrentUser),
      ).rejects.toThrow(`Company #${companyId} not found`);
    });
  });
});
