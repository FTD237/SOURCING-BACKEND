// test/unit/formation/formation.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FormationService } from './formation.service';
import { Formation } from './formation.entity';
import { CreateFormationDto, UpdateFormationDto } from './formation.dto';
import { Statut } from '../common/enum/statut.enum';

// Interface explicite calquée sur les appels réels du service — on évite de
// dériver de Repository<Formation> dont les méthodes save/create sont
// surchargées et font perdre le typage à jest.Mocked.
interface MockFormationRepository {
  find: jest.Mock<Promise<Formation[]>, []>;
  findOne: jest.Mock<Promise<Formation | null>, [{ where: { id: string } }]>;
  save: jest.Mock<Promise<Formation>, [Formation]>;
  create: jest.Mock<Formation, [CreateFormationDto]>;
}

describe('FormationService', () => {
  let service: FormationService;
  let formationRepo: MockFormationRepository;

  const mockCreateDto: CreateFormationDto = {
    nom: 'Développement Full Stack',
    nbr_annee: 3,
    code: 'DEV-FS-01',
  };

  const mockFormation: Formation = {
    id: 'formation-1',
    nom: 'Développement Full Stack',
    nbr_annee: 3,
    code: 'DEV-FS-01',
    statut: Statut.ACTIF,
    dte_creation: new Date('2024-01-01T00:00:00.000Z'),
    dte_modif: new Date('2024-01-01T00:00:00.000Z'),
    dte_suppression: new Date('2024-01-01T00:00:00.000Z'),
    create_by: 'system',
    updated_by: 'system',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Génériques donnés directement à jest.fn() : jest.fn() sans génériques
    // renvoie Mock<any, any, any>, ce qui reste "any" même si la propriété
    // de l'interface est typée — d'où l'unsafe-assignment.
    formationRepo = {
      find: jest.fn<Promise<Formation[]>, []>(),
      findOne: jest.fn<
        Promise<Formation | null>,
        [{ where: { id: string } }]
      >(),
      save: jest.fn<Promise<Formation>, [Formation]>(),
      create: jest.fn<Formation, [CreateFormationDto]>(),
    };

    formationRepo.find.mockResolvedValue([]);
    formationRepo.findOne.mockResolvedValue(null);
    formationRepo.save.mockResolvedValue(mockFormation);
    formationRepo.create.mockReturnValue(mockFormation);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormationService,
        {
          provide: getRepositoryToken(Formation),
          useValue: formationRepo,
        },
      ],
    }).compile();

    service = module.get<FormationService>(FormationService);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create and save a formation', async () => {
      formationRepo.create.mockReturnValue(mockFormation);
      formationRepo.save.mockResolvedValue(mockFormation);

      const result = await service.create(mockCreateDto);

      expect(formationRepo.create).toHaveBeenCalledWith(mockCreateDto);
      expect(formationRepo.save).toHaveBeenCalledWith(mockFormation);
      expect(result).toEqual(mockFormation);
    });

    it('should propagate a database error (e.g. unique constraint on nom/code)', async () => {
      const error = new Error(
        'duplicate key value violates unique constraint "UQ_FORMATION_NOM"',
      );
      formationRepo.save.mockRejectedValue(error);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        'duplicate key value violates unique constraint "UQ_FORMATION_NOM"',
      );
    });
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all formations', async () => {
      const expectedFormations = [mockFormation];
      formationRepo.find.mockResolvedValue(expectedFormations);

      const result = await service.findAll();

      expect(formationRepo.find).toHaveBeenCalledWith();
      expect(result).toEqual(expectedFormations);
    });

    it('should return an empty array when no formation exists', async () => {
      formationRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a formation by ID', async () => {
      formationRepo.findOne.mockResolvedValue(mockFormation);

      const result = await service.findOne('formation-1');

      expect(formationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'formation-1' },
      });
      expect(result).toEqual(mockFormation);
    });

    it('should throw NotFoundException when the formation does not exist', async () => {
      formationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Formation #invalid-id introuvable',
      );
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------
  describe('update', () => {
    const mockUpdateDto: UpdateFormationDto = { nom: 'Full Stack Avancé' };

    it('should update and save an existing formation', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockFormation);
      const updatedFormation: Formation = {
        ...mockFormation,
        nom: 'Full Stack Avancé',
      };
      formationRepo.save.mockResolvedValue(updatedFormation);

      const result = await service.update('formation-1', mockUpdateDto);

      expect(findOneSpy).toHaveBeenCalledWith('formation-1');
      expect(formationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nom: 'Full Stack Avancé' }),
      );
      expect(result).toEqual(updatedFormation);
    });

    it('should allow updating the statut field directly', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockFormation);
      formationRepo.save.mockResolvedValue({
        ...mockFormation,
        statut: Statut.SUPPRIME,
      });

      const result = await service.update('formation-1', {
        statut: Statut.SUPPRIME,
      });

      expect(formationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: Statut.SUPPRIME }),
      );
      expect(result.statut).toBe(Statut.SUPPRIME);
    });

    it('should propagate the not-found error when the formation does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException('Formation #invalid-id introuvable'),
        );

      await expect(service.update('invalid-id', mockUpdateDto)).rejects.toThrow(
        'Formation #invalid-id introuvable',
      );
      expect(formationRepo.save).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('should soft delete a formation (statut + dte_suppression)', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ ...mockFormation });
      formationRepo.save.mockResolvedValue({
        ...mockFormation,
        statut: Statut.SUPPRIME,
      });

      await service.remove('formation-1');

      expect(findOneSpy).toHaveBeenCalledWith('formation-1');
      expect(formationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: Statut.SUPPRIME,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() est typé `any` dans @types/jest, comportement normal des asymmetric matchers
          dte_suppression: expect.any(Date),
        }),
      );
    });

    it('should propagate the not-found error when the formation does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException('Formation #invalid-id introuvable'),
        );

      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Formation #invalid-id introuvable',
      );
      expect(formationRepo.save).not.toHaveBeenCalled();
    });
  });
});
