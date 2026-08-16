// src/offre/offre.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffreService } from './offre.service';
import { Offre } from './offre.entity';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { Statut } from '../common/enum/statut.enum';

describe('OffreService', () => {
  let service: OffreService;
  let repository: jest.Mocked<Repository<Offre>>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockOffre: Offre = {
    id: 'uuid-exemple',
    descriptions: 'Stage Full Stack',
  } as Offre;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffreService,
        {
          provide: getRepositoryToken(Offre),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OffreService>(OffreService);
    repository = module.get(getRepositoryToken(Offre));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('crée une offre et enregistre le créateur', async () => {
      const dto: CreateOffreDto = {
        descriptions: 'Stage Full Stack',
      };
      repository.create.mockReturnValue(mockOffre);
      repository.save.mockResolvedValue(mockOffre);

      const result = await service.create(dto, currentUser);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ create_by: currentUser.id }),
      );
      expect(result).toEqual(mockOffre);
    });
  });

  describe('findAll', () => {
    it('retourne toutes les offres', async () => {
      repository.find.mockResolvedValue([mockOffre]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockOffre]);
    });
  });

  describe('findOne', () => {
    it('retourne une offre si trouvée', async () => {
      repository.findOne.mockResolvedValue(mockOffre);

      const result = await service.findOne('exemple-uuid');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockOffre);
    });

    it("lève une 404 si l'offre n'existe pas", async () => {
      repository.findOne.mockResolvedValue(null);
      const notFoundSpy = jest
        .spyOn(ExceptionFactory, 'notFound')
        .mockImplementation(() => {
          throw new Error('not found');
        });

      await expect(service.findOne('exemple-uuid')).rejects.toThrow(
        'not found',
      );
      expect(notFoundSpy).toHaveBeenCalledWith('Offre #999 introuvable.');
    });
  });

  describe('update', () => {
    it('met à jour une offre et audite le user', async () => {
      repository.findOne.mockResolvedValue({ ...mockOffre });
      repository.save.mockImplementation((o) => Promise.resolve(o as Offre));

      const dto: UpdateOffreDto = { descriptions: 'Stage mis à jour' };
      const result = await service.update('exemple-uuid', dto, currentUser);

      expect(result.descriptions).toBe('Stage mis à jour');
      expect(result.updated_by).toBe(currentUser.id);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('effectue un soft delete', async () => {
      repository.findOne.mockResolvedValue({ ...mockOffre });
      repository.save.mockResolvedValue({} as Offre);

      await service.remove('exemple-uuid', currentUser);

      const savedArg = repository.save.mock.calls[0][0] as Offre;
      expect(savedArg.statut).toBe(Statut.SUPPRIME);
      expect(savedArg.dte_suppression).toBeInstanceOf(Date);
      expect(savedArg.updated_by).toBe(currentUser.id);
    });

    it('capture une erreur DB via ExceptionFactory.database', async () => {
      repository.findOne.mockResolvedValue({ ...mockOffre });
      repository.save.mockRejectedValue(new Error('db error'));
      const dbSpy = jest
        .spyOn(ExceptionFactory, 'database')
        .mockImplementation(() => {
          throw new Error('database error');
        });

      await expect(service.remove('exemple-uuid', currentUser)).rejects.toThrow(
        'database error',
      );
      expect(dbSpy).toHaveBeenCalled();
    });
  });
});
