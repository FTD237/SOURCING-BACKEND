// experience.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';
import { Experience } from './experience.entity';
import { Statut } from '../common/enum/statut.enum';

describe('ExperienceController', () => {
  let controller: ExperienceController;

  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindByEtudiant = jest.fn();
  const mockFindOne = jest.fn();
  const mockUpdate = jest.fn();
  const mockRemove = jest.fn();

  const serviceMock = {
    create: mockCreate,
    findAll: mockFindAll,
    findByEtudiant: mockFindByEtudiant,
    findOne: mockFindOne,
    update: mockUpdate,
    remove: mockRemove,
  };

  const buildExperience = (overrides: Partial<Experience> = {}): Experience =>
    ({
      id: 'exp-1',
      student_id: 'etu-1',
      company_id: 'comp-1',
      intitule: 'Développeur',
      description: 'Stage',
      type: 'stage',
      date_debut: new Date('2026-01-01'),
      date_fin: new Date('2026-06-01'),
      statut: Statut.ACTIF,
      dte_suppression: null,
      etudiant: undefined,
      created_by: 1,
      updated_by: 1,
      ...overrides,
    }) as Experience;

  const mockExperience = buildExperience();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienceController],
      providers: [{ provide: ExperienceService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ExperienceController>(ExperienceController);
  });

  afterEach(() => jest.clearAllMocks());

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it("devrait appeler experienceService.create avec le dto et retourner l'expérience créée", async () => {
      const dto: CreateExperienceDto = {
        student_id: 'etu-1',
        company_id: 'comp-1',
        intitule: 'Développeur',
        description: 'Stage',
        type: 'stage',
        date_debut: '2026-01-01',
        date_fin: '2026-06-01',
      };
      mockCreate.mockResolvedValue(mockExperience);

      const result = await controller.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockExperience);
    });
  });

  describe('findAll', () => {
    it('devrait retourner la liste de toutes les expériences', async () => {
      mockFindAll.mockResolvedValue([mockExperience]);

      const result = await controller.findAll();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual([mockExperience]);
    });

    it('devrait retourner une liste vide si aucune expérience', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByEtudiant', () => {
    it("devrait appeler experienceService.findByEtudiant avec l'id étudiant", async () => {
      mockFindByEtudiant.mockResolvedValue([mockExperience]);

      const result = await controller.findByEtudiant('etu-1');

      expect(mockFindByEtudiant).toHaveBeenCalledWith('etu-1');
      expect(result).toEqual([mockExperience]);
    });

    it('devrait retourner un tableau vide si aucune expérience pour cet étudiant', async () => {
      mockFindByEtudiant.mockResolvedValue([]);

      const result = await controller.findByEtudiant('etu-inconnu');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une expérience par son id', async () => {
      mockFindOne.mockResolvedValue(mockExperience);

      const result = await controller.findOne('exp-1');

      expect(mockFindOne).toHaveBeenCalledWith('exp-1');
      expect(result).toEqual(mockExperience);
    });

    it("devrait propager la NotFoundException si l'expérience n'existe pas", async () => {
      mockFindOne.mockRejectedValue(
        new NotFoundException('Expérience #inconnu introuvable'),
      );

      await expect(controller.findOne('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une expérience et retourner le résultat', async () => {
      const dto: UpdateExperienceDto = { statut: Statut.INACTIF };
      const updated = buildExperience({ statut: Statut.INACTIF });
      mockUpdate.mockResolvedValue(updated);

      const result = await controller.update('exp-1', dto);

      expect(mockUpdate).toHaveBeenCalledWith('exp-1', dto);
      expect(result).toEqual(updated);
    });

    it("devrait propager la NotFoundException si l'expérience à mettre à jour n'existe pas", async () => {
      mockUpdate.mockRejectedValue(
        new NotFoundException('Expérience #inconnu introuvable'),
      );

      await expect(controller.update('inconnu', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('devrait supprimer (soft delete) une expérience', async () => {
      mockRemove.mockResolvedValue(undefined);

      const result = await controller.remove('exp-1');

      expect(mockRemove).toHaveBeenCalledWith('exp-1');
      expect(result).toBeUndefined();
    });

    it("devrait propager la NotFoundException si l'expérience à supprimer n'existe pas", async () => {
      mockRemove.mockRejectedValue(
        new NotFoundException('Expérience #inconnu introuvable'),
      );

      await expect(controller.remove('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
