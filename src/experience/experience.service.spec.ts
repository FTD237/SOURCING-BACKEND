// experience.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { Experience } from './experience.entity';
import { Statut } from '../common/enum/statut.enum';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { FileEntity } from '../file/file.entity';

describe('ExperienceService', () => {
  let service: ExperienceService;

  const currentUser = { id: 'user-1' };

  // Mocks déclarés comme variables indépendantes : on évite ainsi de
  // référencer des méthodes "unbound" via repo.xxx dans les assertions.
  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindOne = jest.fn();
  // Repository FileEntity distinct : il sert à rattacher les médias.
  const mockFileFind = jest.fn();

  const repoMock = {
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    findOne: mockFindOne,
  };
  const fileRepoMock = { find: mockFileFind };

  // Les relations chargées par le service (findAll / findByEtudiant / findOne).
  const RELATIONS = { etudiant: { user: true }, company: true };

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

  // Le service modifie l'objet reçu : on le reconstruit avant chaque test
  // pour éviter qu'un test pollue le suivant.
  let mockExperience: Experience;

  beforeEach(async () => {
    mockExperience = buildExperience();
    mockFileFind.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienceService,
        { provide: getRepositoryToken(Experience), useValue: repoMock },
        { provide: getRepositoryToken(FileEntity), useValue: fileRepoMock },
      ],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
  });

  // resetAllMocks (et pas clearAllMocks) : on efface aussi les valeurs
  // mockResolvedValue laissées par le test précédent.
  afterEach(() => jest.resetAllMocks());

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
      // le service recharge l'expérience après le save
      mockFindOne.mockResolvedValue(mockExperience);

      const result = await service.create(dto, currentUser);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'etu-1',
          company_id: 'comp-1',
          intitule: 'Développeur',
        }),
      );
      expect(mockSave).toHaveBeenCalledWith(mockExperience);
      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'exp-1' } }),
      );
      expect(result).toMatchObject({ id: 'exp-1', media: [] });
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les expériences avec leurs relations', async () => {
      mockFind.mockResolvedValue([mockExperience]);

      const result = await service.findAll();

      expect(mockFind).toHaveBeenCalledWith({ relations: RELATIONS });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'exp-1', media: [] });
    });
  });

  describe('findByEtudiant', () => {
    it('devrait retourner les expériences filtrées par student_id', async () => {
      mockFind.mockResolvedValue([mockExperience]);

      const result = await service.findByEtudiant('etu-1');

      expect(mockFind).toHaveBeenCalledWith({
        where: { student_id: 'etu-1' },
        relations: RELATIONS,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'exp-1' });
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
        relations: RELATIONS,
      });
      expect(result).toMatchObject({ id: 'exp-1', media: [] });
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
      };

      mockFindOne.mockResolvedValue(mockExperience);
      mockSave.mockImplementation((e: Experience) => Promise.resolve(e));

      const result = await service.update('exp-1', dto, currentUser);

      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(result).toMatchObject({
        id: 'exp-1',
        statut: Statut.INACTIF,
        updated_by: currentUser.id,
      });
    });

    it("devrait lever une NotFoundException si l'expérience à mettre à jour n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.update('inconnu', {}, currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('devrait faire un soft delete (statut SUPPRIME + date de suppression)', async () => {
      mockFindOne.mockResolvedValue(buildExperience());
      mockSave.mockResolvedValue(mockExperience);

      await service.remove('exp-1', currentUser);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: Statut.SUPPRIME,
          dte_suppression: expect.any(Date) as Date,
        }),
      );
    });

    it("devrait lever une NotFoundException si l'expérience à supprimer n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.remove('inconnu', currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
