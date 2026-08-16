// src/postuler/postuler.controller.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PostulerController } from './postuler.controller';
import { PostulerService } from './postuler.service';
import { Postuler } from './postuler.entity';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';

describe('PostulerController', () => {
  let controller: PostulerController;
  let service: jest.Mocked<PostulerService>;

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
      controllers: [PostulerController],
      providers: [
        {
          provide: PostulerService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByEtudiant: jest.fn(),
            findByOffre: jest.fn(),
            updateStatut: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostulerController>(PostulerController);
    service = module.get(PostulerService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create() délègue au service', async () => {
    const dto: CreatePostulerDto = {
      offreId: 'offre-1',
      etudiantId: 'etudiant-1',
    };
    service.create.mockResolvedValue(mockPostuler);

    const result = await controller.create(dto, currentUser);

    expect(service.create).toHaveBeenCalledWith(dto, currentUser);
    expect(result).toEqual(mockPostuler);
  });

  it('findAll() retourne la liste des candidatures', async () => {
    service.findAll.mockResolvedValue([mockPostuler]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockPostuler]);
  });

  it('findOne() retourne une candidature par id', async () => {
    service.findOne.mockResolvedValue(mockPostuler);

    const result = await controller.findOne('postuler-1');

    expect(service.findOne).toHaveBeenCalledWith('postuler-1');
    expect(result).toEqual(mockPostuler);
  });

  it('findByEtudiant() délègue au service', async () => {
    service.findByEtudiant.mockResolvedValue([mockPostuler]);

    const result = await controller.findByEtudiant('etudiant-1');

    expect(service.findByEtudiant).toHaveBeenCalledWith('etudiant-1');
    expect(result).toEqual([mockPostuler]);
  });

  it('findByOffre() délègue au service', async () => {
    service.findByOffre.mockResolvedValue([mockPostuler]);

    const result = await controller.findByOffre('offre-1');

    expect(service.findByOffre).toHaveBeenCalledWith('offre-1');
    expect(result).toEqual([mockPostuler]);
  });

  it('updateStatut() transmet le dto et le currentUser', async () => {
    const dto: UpdatePostulerStatutDto = {
      statut: StatutCandidature.ACCEPTEE,
    };
    const updated: Postuler = {
      ...mockPostuler,
      statut_candidature: StatutCandidature.ACCEPTEE,
    };
    service.updateStatut.mockResolvedValue(updated);

    const result = await controller.updateStatut(
      'postuler-1',
      dto,
      currentUser,
    );

    expect(service.updateStatut).toHaveBeenCalledWith(
      'postuler-1',
      dto,
      currentUser,
    );
    expect(result.statut_candidature).toBe(StatutCandidature.ACCEPTEE);
  });

  it('remove() transmet id et currentUser', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('postuler-1', currentUser);

    expect(service.remove).toHaveBeenCalledWith('postuler-1', currentUser);
  });
});
