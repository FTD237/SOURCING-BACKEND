// test/unit/etudiant/etudiant.controller.spec.ts

import { TestingModule } from '@nestjs/testing';
import { EtudiantController } from './etudiant.controller';
import { EtudiantService } from './etudiant.service';
import {
  CreateEtudiantDto,
  CreateEtudiantResponseDto,
  UpdateEtudiantDto,
} from './etudiant.dto';
import { Statut } from '../common/enum/statut.enum';
import { Etudiant } from './etudiant.entity';
import { createControllerTestingModule } from '../../test/support/create-controller-testing-module';
import {
  createServiceMocks,
  ServiceMocks,
} from '../../test/support/create-service-mocks';

type CurrentUser = { id: string; email: string };

type EtudiantServiceMethods =
  'create' | 'findAll' | 'findOne' | 'update' | 'remove';

describe('EtudiantController', () => {
  let controller: EtudiantController;
  let mocks: ServiceMocks<EtudiantService, EtudiantServiceMethods>;

  const mockCurrentUser: CurrentUser = {
    id: 'user-1',
    email: 'admin@test.com',
  };

  const mockCreateDto: CreateEtudiantDto = {
    email: 'aline.kamga@example.com',
    nom: 'Kamga',
    prenom: 'Aline',
    promotionId: 'promotion-1',
    matricule: 'mat-1',
    annee_acad: '2027-2028',
    country_code: 'CM',
  } as CreateEtudiantDto;

  const mockUpdateDto: UpdateEtudiantDto = {
    nom: 'Kamga',
    prenom: 'Aline-Marie',
  };

  const mockUser = {
    id: 'user-2',
    email: 'aline.kamga@example.com',
    nom: 'Kamga',
    prenom: 'Aline',
    statut: Statut.EN_ATTENTE_ACTIVATION,
  };

  const mockEtudiant = {
    id: 'etudiant-1',
    user_id: 'user-2',
    statut: Statut.ACTIF,
    user: mockUser,
  };

  const mockCreateResponse: CreateEtudiantResponseDto = {
    user: mockUser,
    etudiant: mockEtudiant,
    generatedPassword: 'GeneratedPass123!',
  } as unknown as CreateEtudiantResponseDto;

  beforeEach(async () => {
    // ✅ Mocks de service générés par un helper partagé (typés, sans any)
    // -> plus de bloc `mockCreate = jest.fn(); mockFindAll = jest.fn(); ...`
    //    dupliqué entre chaque *.controller.spec.ts
    mocks = createServiceMocks<EtudiantService>()([
      'create',
      'findAll',
      'findOne',
      'update',
      'remove',
    ]);

    const module: TestingModule = await createControllerTestingModule(
      EtudiantController,
      [{ provide: EtudiantService, useValue: mocks }],
    );

    controller = module.get<EtudiantController>(EtudiantController);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create an etudiant and return the response', async () => {
      mocks.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(mockCreateDto, mockCurrentUser);

      expect(mocks.create).toHaveBeenCalledWith(mockCreateDto, mockCurrentUser);
      expect(result).toEqual(mockCreateResponse);
    });

    it.each([
      [
        'conflict error when the email already exists',
        `Un utilisateur avec l'email ${mockCreateDto.email} existe déjà`,
      ],
      [
        'not found error when the role does not exist',
        'Le rôle "etudiant" n\'existe pas',
      ],
    ])('should propagate a %s', async (_label, errorMessage) => {
      mocks.create.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.create(mockCreateDto, mockCurrentUser),
      ).rejects.toThrow(errorMessage);
    });
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all etudiants', async () => {
      const expectedResult = [mockEtudiant];
      mocks.findAll.mockResolvedValue(expectedResult as unknown as Etudiant[]);

      const result = await controller.findAll();

      expect(mocks.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return an empty array when no etudiants exist', async () => {
      mocks.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return an etudiant by ID', async () => {
      const etudiantId = 'etudiant-1';
      mocks.findOne.mockResolvedValue(mockEtudiant as unknown as Etudiant);

      const result = await controller.findOne(etudiantId);

      expect(mocks.findOne).toHaveBeenCalledWith(etudiantId);
      expect(result).toEqual(mockEtudiant);
    });

    it('should propagate a not found error when the etudiant does not exist', async () => {
      const etudiantId = 'invalid-id';
      mocks.findOne.mockRejectedValue(
        new Error(`Étudiant #${etudiantId} introuvable`),
      );

      await expect(controller.findOne(etudiantId)).rejects.toThrow(
        `Étudiant #${etudiantId} introuvable`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('should update an etudiant and return the updated entity', async () => {
      const etudiantId = 'etudiant-1';
      const updatedEtudiant = {
        ...mockEtudiant,
        user: { ...mockUser, prenom: 'Aline-Marie' },
      };
      mocks.update.mockResolvedValue(updatedEtudiant as unknown as Etudiant);

      const result = await controller.update(
        etudiantId,
        mockUpdateDto,
        mockCurrentUser,
      );

      expect(mocks.update).toHaveBeenCalledWith(
        etudiantId,
        mockUpdateDto,
        mockCurrentUser,
      );
      expect(result).toEqual(updatedEtudiant);
    });

    it('should propagate a not found error when the etudiant does not exist', async () => {
      const etudiantId = 'invalid-id';
      mocks.update.mockRejectedValue(
        new Error(`Etudiant #${etudiantId} not found`),
      );

      await expect(
        controller.update(etudiantId, mockUpdateDto, mockCurrentUser),
      ).rejects.toThrow(`Etudiant #${etudiantId} not found`);
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete an etudiant', async () => {
      const etudiantId = 'etudiant-1';
      mocks.remove.mockResolvedValue(undefined);

      const result = await controller.remove(etudiantId, mockCurrentUser);

      expect(mocks.remove).toHaveBeenCalledWith(etudiantId, mockCurrentUser);
      expect(result).toBeUndefined();
    });

    it('should propagate a not found error when the etudiant does not exist', async () => {
      const etudiantId = 'invalid-id';
      mocks.remove.mockRejectedValue(
        new Error(`Etudiant #${etudiantId} not found`),
      );

      await expect(
        controller.remove(etudiantId, mockCurrentUser),
      ).rejects.toThrow(`Etudiant #${etudiantId} not found`);
    });
  });
});
