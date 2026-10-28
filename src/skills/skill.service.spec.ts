// skill.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SkillService } from './skill.service';
import { Skill } from './skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
import { Statut } from '../common/enum/statut.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

describe('SkillService', () => {
  let service: SkillService;
  let repository: jest.Mocked<Repository<Skill>>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockSkill = {
    id: 'skill-1',
    nom: 'react',
  } as Skill;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillService,
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
    repository = module.get(getRepositoryToken(Skill));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateSkillDto = { nom: 'react' };

    it('should create a skill when the name does not already exist', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockSkill);
      repository.save.mockResolvedValue(mockSkill);

      const result = await service.create(dto, currentUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { nom: dto.nom },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSkill);
    });

    it('should throw ConflictException when the skill name already exists', async () => {
      repository.findOne.mockResolvedValue(mockSkill);

      await expect(service.create(dto, currentUser)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all skills', async () => {
      repository.find.mockResolvedValue([mockSkill]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockSkill]);
    });
  });

  describe('findOne', () => {
    it('should return one skill', async () => {
      repository.findOne.mockResolvedValue(mockSkill);

      const result = await service.findOne('skill-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
      });
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('skill-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing skill', async () => {
      const dto: UpdateSkillDto = { nom: 'react-native' };
      const updated = { ...mockSkill, nom: 'react-native' };
      repository.findOne.mockResolvedValue(mockSkill);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('skill-1', dto, currentUser);

      expect(result.nom).toEqual('react-native');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a non-existing skill', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('skill-1', { nom: 'x' }, currentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete an existing skill', async () => {
      repository.findOne.mockResolvedValue(mockSkill);
      repository.remove.mockResolvedValue(mockSkill);

      await service.remove('skill-1', currentUser);

      expect(mockSkill.statut).toEqual(Statut.SUPPRIME);
      expect(mockSkill.updated_by).toEqual(currentUser.id);
      expect(repository.remove).toHaveBeenCalledWith(mockSkill);
    });

    it('should throw NotFoundException when removing a non-existing skill', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('skill-1', currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call ExceptionFactory.database when repository.remove fails', async () => {
      const dbError = new Error('DB error');
      repository.findOne.mockResolvedValue(mockSkill);
      repository.remove.mockRejectedValue(dbError);
      const spy = jest
        .spyOn(ExceptionFactory, 'database')
        .mockImplementation(() => {
          throw dbError;
        });

      await expect(service.remove('skill-1', currentUser)).rejects.toThrow();

      expect(spy).toHaveBeenCalledWith(dbError, 'Skill');
      spy.mockRestore();
    });
  });
});
