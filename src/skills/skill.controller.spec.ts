// skill.controller.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';
import { Skill } from './skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';

describe('SkillController', () => {
  let controller: SkillController;
  let service: jest.Mocked<SkillService>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockSkill = {
    id: 'skill-1',
    nom: 'react',
  } as Skill;

  const mockSkillList: Skill[] = [mockSkill];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillController],
      providers: [
        {
          provide: SkillService,
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

    controller = module.get<SkillController>(SkillController);
    service = module.get(SkillService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const dto: CreateSkillDto = { nom: 'react' };
      service.create.mockResolvedValue(mockSkill);

      const result = await controller.create(dto, currentUser);

      expect(service.create).toHaveBeenCalledWith(dto, currentUser);
      expect(result).toEqual(mockSkill);
    });
  });

  describe('findAll', () => {
    it('should return an array of skills', async () => {
      service.findAll.mockResolvedValue(mockSkillList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockSkillList);
    });
  });

  describe('findOne', () => {
    it('should return one skill', async () => {
      service.findOne.mockResolvedValue(mockSkill);

      const result = await controller.findOne('skill-1');

      expect(service.findOne).toHaveBeenCalledWith('skill-1');
      expect(result).toEqual(mockSkill);
    });
  });

  describe('update', () => {
    it('should update and return the skill', async () => {
      const dto: UpdateSkillDto = { nom: 'react-native' };
      const updated = { ...mockSkill, nom: 'react-native' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('skill-1', dto, currentUser);

      expect(service.update).toHaveBeenCalledWith('skill-1', dto, currentUser);
      expect(result.nom).toEqual('react-native');
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('skill-1', currentUser);

      expect(service.remove).toHaveBeenCalledWith('skill-1', currentUser);
    });
  });
});
