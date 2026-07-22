// experience.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { Experience } from './experience.entity';
import { Statut } from '../common/enum/statut.enum';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';

describe('ExperienceService', () => {
  let service: ExperienceService;

  // Mocks déclarés comme variables indépendantes : on évite ainsi de
  // référencer des méthodes "unbound" via repo.xxx dans les assertions.
  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindOne = jest.fn();

  const repoMock = {
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    findOne: mockFindOne,
  };

  const buildExperience = (overrides: Partial<Experience> = {}): Experience =>
    ({
      id: 'exp-1',
      student_id: 'etu-1',
      company_id: 'comp-1',
      rh_id: undefined,
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
      providers: [
        ExperienceService,
        { provide: getRepositoryToken(Experience), useValue: repoMock },
      ],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
  });

  afterEach(() => jest.clearAllMocks());

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer et sauvegarder une expérience', async () => {
      const dto: CreateExperienceDto = {
        student_id: 'etu-1',
        company_id: 'comp-1',
        intitule: 'Développeur',
        description: 'Stage',
        type: 'stage',
        date_debut: '2026-01-01',
        date_fin: '2026-06-01',
      };

      mockCreate.mockReturnValue(mockExperience);
      mockSave.mockResolvedValue(mockExperience);

      const result = await service.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(mockSave).toHaveBeenCalledWith(mockExperience);
      expect(result).toEqual(mockExperience);
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les expériences avec la relation étudiant', async () => {
      mockFind.mockResolvedValue([mockExperience]);

      const result = await service.findAll();

      expect(mockFind).toHaveBeenCalledWith({ relations: { etudiant: true } });
      expect(result).toEqual([mockExperience]);
    });
  });

  describe('findByEtudiant', () => {
    it('devrait retourner les expériences filtrées par student_id', async () => {
      mockFind.mockResolvedValue([mockExperience]);

      const result = await service.findByEtudiant('etu-1');

      expect(mockFind).toHaveBeenCalledWith({
        where: { student_id: 'etu-1' },
        relations: { etudiant: true },
      });
      expect(result).toEqual([mockExperience]);
    });

    it('devrait retourner un tableau vide si aucune expérience trouvée', async () => {
      mockFind.mockResolvedValue([]);

      const result = await service.findByEtudiant('etu-inconnu');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une expérience existante', async () => {
      mockFindOne.mockResolvedValue(mockExperience);

      const result = await service.findOne('exp-1');

      expect(mockFindOne).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
        relations: { etudiant: true },
      });
      expect(result).toEqual(mockExperience);
    });

    it("devrait lever une NotFoundException si l'expérience n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('inconnu')).rejects.toThrow(
        'Expérience #inconnu introuvable',
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une expérience existante', async () => {
      const dto: UpdateExperienceDto = {
        statut: Statut.INACTIF,
      } as UpdateExperienceDto;
      const updated = buildExperience({ statut: Statut.INACTIF });

      mockFindOne.mockResolvedValue(mockExperience);
      mockSave.mockResolvedValue(updated);

      const result = await service.update('exp-1', dto);

      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(result).toEqual(updated);
    });

    it("devrait lever une NotFoundException si l'expérience à mettre à jour n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.update('inconnu', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('devrait faire un soft delete (statut SUPPRIME + date de suppression)', async () => {
      mockFindOne.mockResolvedValue(buildExperience());
      mockSave.mockResolvedValue(mockExperience);

      await service.remove('exp-1');

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: Statut.SUPPRIME,
          dte_suppression: expect.any(Date) as Date,
        }),
      );
    });

    it("devrait lever une NotFoundException si l'expérience à supprimer n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
