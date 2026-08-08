import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { User } from '../user/user.entity';
import { Company } from './company.entity';
import { Statut } from '../common/enum/statut.enum';

describe('CompanyController', () => {
  let controller: CompanyController;

  const mockCurrentUser = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@test.com',
  };

  const mockCreateDto: CreateCompanyDto = {
    nom: 'Tech Corp',
    prenom: 'Jean',
    email: 'jean@techcorp.com',
    country_code: 'FR',
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

  // ✅ Typé directement depuis la signature réelle du service.
  // Un seul paramètre de type générique par déclaration -> pas d'ambiguïté de parsing.
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
  // findAll()
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all companies', async () => {
      const expectedResult = [mockCompanyWithUser];
      mockFindAll.mockResolvedValue(expectedResult as unknown as Company[]);

      const result = await controller.findAll();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return empty array when no companies exist', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
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
