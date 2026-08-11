// test/unit/formation/formation.controller.spec.ts

import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { CreateFormationDto, UpdateFormationDto } from './formation.dto';
import { Formation } from './formation.entity';
import { Statut } from '../common/enum/statut.enum';
import { createControllerTestingModule } from '../../test/support/create-controller-testing-module';
import {
  createServiceMocks,
  ServiceMocks,
} from '../../test/support/create-service-mocks';

type FormationServiceMethods =
  'create' | 'findAll' | 'findOne' | 'update' | 'remove';

describe('FormationController', () => {
  let controller: FormationController;
  let mocks: ServiceMocks<FormationService, FormationServiceMethods>;

  const mockCreateDto: CreateFormationDto = {
    nom: 'Développement Full Stack',
    nbr_annee: 3,
    code: 'DEV-FS-01',
  };

  const mockUpdateDto: UpdateFormationDto = {
    nom: 'Full Stack Avancé',
  };

  const mockFormation: Partial<Formation> = {
    id: 'formation-1',
    nom: 'Développement Full Stack',
    nbr_annee: 3,
    code: 'DEV-FS-01',
    statut: Statut.ACTIF,
  };

  beforeEach(async () => {
    mocks = createServiceMocks<FormationService>()([
      'create',
      'findAll',
      'findOne',
      'update',
      'remove',
    ]);

    const module: TestingModule = await createControllerTestingModule(
      FormationController,
      [{ provide: FormationService, useValue: mocks }],
    );

    controller = module.get<FormationController>(FormationController);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create a formation and return it', async () => {
      mocks.create.mockResolvedValue(mockFormation as unknown as Formation);

      const result = await controller.create(mockCreateDto);

      expect(mocks.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockFormation);
    });

    it('should propagate a conflict error when the nom/code already exists', async () => {
      const error = new Error(
        'duplicate key value violates unique constraint "UQ_FORMATION_NOM"',
      );
      mocks.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDto)).rejects.toThrow(
        'duplicate key value violates unique constraint "UQ_FORMATION_NOM"',
      );
    });
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all formations', async () => {
      const expectedResult = [mockFormation];
      mocks.findAll.mockResolvedValue(expectedResult as unknown as Formation[]);

      const result = await controller.findAll();

      expect(mocks.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return an empty array when no formation exists', async () => {
      mocks.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a formation by ID', async () => {
      const formationId = 'formation-1';
      mocks.findOne.mockResolvedValue(mockFormation as unknown as Formation);

      const result = await controller.findOne(formationId);

      expect(mocks.findOne).toHaveBeenCalledWith(formationId);
      expect(result).toEqual(mockFormation);
    });

    it('should propagate a not found error when the formation does not exist', async () => {
      const formationId = 'invalid-id';
      mocks.findOne.mockRejectedValue(
        new NotFoundException(`Formation #${formationId} introuvable`),
      );

      await expect(controller.findOne(formationId)).rejects.toThrow(
        `Formation #${formationId} introuvable`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('should update a formation and return the updated entity', async () => {
      const formationId = 'formation-1';
      const updatedFormation = { ...mockFormation, nom: 'Full Stack Avancé' };
      mocks.update.mockResolvedValue(updatedFormation as unknown as Formation);

      const result = await controller.update(formationId, mockUpdateDto);

      expect(mocks.update).toHaveBeenCalledWith(formationId, mockUpdateDto);
      expect(result).toEqual(updatedFormation);
    });

    it('should propagate a not found error when the formation does not exist', async () => {
      const formationId = 'invalid-id';
      mocks.update.mockRejectedValue(
        new NotFoundException(`Formation #${formationId} introuvable`),
      );

      await expect(
        controller.update(formationId, mockUpdateDto),
      ).rejects.toThrow(`Formation #${formationId} introuvable`);
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('should soft delete a formation', async () => {
      const formationId = 'formation-1';
      mocks.remove.mockResolvedValue(undefined);

      const result = await controller.remove(formationId);

      expect(mocks.remove).toHaveBeenCalledWith(formationId);
      expect(result).toBeUndefined();
    });

    it('should propagate a not found error when the formation does not exist', async () => {
      const formationId = 'invalid-id';
      mocks.remove.mockRejectedValue(
        new NotFoundException(`Formation #${formationId} introuvable`),
      );

      await expect(controller.remove(formationId)).rejects.toThrow(
        `Formation #${formationId} introuvable`,
      );
    });
  });
});
