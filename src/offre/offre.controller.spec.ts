// src/offre/offre.controller.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { OffreController } from './offre.controller';
import { OffreService } from './offre.service';
import { Offre } from './offre.entity';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';

describe('OffreController', () => {
  let controller: OffreController;
  let service: jest.Mocked<OffreService>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockOffre: Offre = {
    id: 'exemple-uuid',
    descriptions: 'Stage Full Stack',
  } as Offre;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffreController],
      providers: [
        {
          provide: OffreService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OffreController>(OffreController);
    service = module.get(OffreService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create() délègue au service', async () => {
    const dto: CreateOffreDto = {
      descriptions: 'Stage Full Stack',
    };
    service.create.mockResolvedValue(mockOffre);

    const result = await controller.create(dto, currentUser);

    expect(service.create).toHaveBeenCalledWith(dto, currentUser);
    expect(result).toEqual(mockOffre);
  });

  it('findAll() retourne la liste des offres', async () => {
    service.findAll.mockResolvedValue([mockOffre]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockOffre]);
  });

  it('findOne() retourne une offre par id', async () => {
    service.findOne.mockResolvedValue(mockOffre);

    const result = await controller.findOne('exemple-uuid');

    expect(service.findOne).toHaveBeenCalledWith('exemple-uuid');
    expect(result).toEqual(mockOffre);
  });

  it('update() transmet id, dto et currentUser', async () => {
    const dto: UpdateOffreDto = { descriptions: 'Nouvelle description' };
    const updated: Offre = {
      ...mockOffre,
      descriptions: 'Nouvelle description',
    };
    service.update.mockResolvedValue(updated);

    const result = await controller.update('exemple-uuid', dto, currentUser);

    expect(service.update).toHaveBeenCalledWith(
      'exemple-uuid',
      dto,
      currentUser,
    );
    expect(result.descriptions).toBe('Nouvelle description');
  });

  it('remove() transmet id et currentUser', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('exemple-uuid', currentUser);

    expect(service.remove).toHaveBeenCalledWith('exemple-uuid', currentUser);
  });
});
