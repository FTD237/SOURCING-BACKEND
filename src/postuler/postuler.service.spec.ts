// src/postuler/postuler.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulerService } from './postuler.service';
import { Postuler } from './postuler.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';
import { Statut } from '../common/enum/statut.enum';

describe('PostulerService', () => {
  let service: PostulerService;
  let repository: jest.Mocked<Repository<Postuler>>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockPostuler: Postuler = {
    id: 'postuler-1',
    offreId: 'offre-1',
    etudiantId: 'etudiant-1',
    date_candidature: new Date(),
    statut_candidature: StatutCandidature.EN_ATTENTE,
  } as Postuler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulerService,
        {
          provide: getRepositoryToken(Postuler),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostulerService>(PostulerService);
    repository = module.get(getRepositoryToken(Postuler));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreatePostulerDto = {
      offreId: 'offre-1',
      etudiantId: 'etudiant-1',
    };

    it("crée une candidature quand aucune n'existe déjà", async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockPostuler);
      repository.save.mockResolvedValue(mockPostuler);

      const result = await service.create(dto, currentUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { offreId: dto.offreId, etudiantId: dto.etudiantId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockPostuler);
      expect(result).toEqual(mockPostuler);
    });

    it('lève un conflit si la candidature existe déjà', async () => {
      repository.findOne.mockResolvedValue(mockPostuler);
      const conflictSpy = jest
        .spyOn(ExceptionFactory, 'conflict')
        .mockImplementation(() => {
          throw new Error('conflict');
        });

      await expect(service.create(dto, currentUser)).rejects.toThrow(
        'conflict',
      );
      expect(conflictSpy).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retourne toutes les candidatures avec relations', async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: { offre: true, etudiant: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('findOne', () => {
    it('retourne la candidature si trouvée', async () => {
      repository.findOne.mockResolvedValue(mockPostuler);

      const result = await service.findOne('postuler-1');

      expect(result).toEqual(mockPostuler);
    });

    it("lève une 404 si la candidature n'existe pas", async () => {
      repository.findOne.mockResolvedValue(null);
      const notFoundSpy = jest
        .spyOn(ExceptionFactory, 'notFound')
        .mockImplementation(() => {
          throw new Error('not found');
        });

      await expect(service.findOne('unknown')).rejects.toThrow('not found');
      expect(notFoundSpy).toHaveBeenCalled();
    });
  });

  describe('findByOffre', () => {
    it('retourne les candidatures pour une offre', async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findByOffre('offre-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { offreId: 'offre-1' },
        relations: { etudiant: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('findByEtudiant', () => {
    it("retourne les candidatures d'un étudiant", async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findByEtudiant('etudiant-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { etudiantId: 'etudiant-1' },
        relations: { offre: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('updateStatut', () => {
    it('met à jour le statut et audite le user', async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler });
      repository.save.mockImplementation((p) => Promise.resolve(p as Postuler));

      const dto: UpdatePostulerStatutDto = {
        statut: StatutCandidature.ACCEPTEE,
      };
      const result = await service.updateStatut('postuler-1', dto, currentUser);

      expect(result.statut_candidature).toBe(StatutCandidature.ACCEPTEE);
      expect(result.updated_by).toBe(currentUser.id);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('effectue un soft delete', async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler });
      repository.save.mockResolvedValue({} as Postuler);

      await service.remove('postuler-1', currentUser);

      const savedArg = repository.save.mock.calls[0][0] as Postuler;
      expect(savedArg.statut).toBe(Statut.SUPPRIME);
      expect(savedArg.dte_suppression).toBeInstanceOf(Date);
      expect(savedArg.updated_by).toBe(currentUser.id);
    });

    it('capture une erreur DB via ExceptionFactory.database', async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler });
      repository.save.mockRejectedValue(new Error('db error'));
      const dbSpy = jest
        .spyOn(ExceptionFactory, 'database')
        .mockImplementation(() => {
          throw new Error('database error');
        });

      await expect(service.remove('postuler-1', currentUser)).rejects.toThrow(
        'database error',
      );
      expect(dbSpy).toHaveBeenCalled();
    });
  });
});
