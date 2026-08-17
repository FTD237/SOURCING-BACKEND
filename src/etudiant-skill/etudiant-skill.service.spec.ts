// etudiant-skill.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EtudiantSkillService } from './etudiant-skill.service';
import { EtudiantSkill } from './etudiant-skill.entity';
import { NiveauCompetence } from '../common/enum/niveau-competence.enum';
import { Statut } from '../common/enum/statut.enum';

describe('EtudiantSkillService', () => {
  let service: EtudiantSkillService;
  let repository: jest.Mocked<Repository<EtudiantSkill>>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockEtudiantSkill: EtudiantSkill = {
    etudiantId: 'etu-1',
    skillId: 'skill-1',
    level: NiveauCompetence.INTERMEDIAIRE,
  } as EtudiantSkill;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtudiantSkillService,
        {
          provide: getRepositoryToken(EtudiantSkill),
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

    service = module.get<EtudiantSkillService>(EtudiantSkillService);
    repository = module.get(getRepositoryToken(EtudiantSkill));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      etudiantId: 'etu-1',
      skillId: 'skill-1',
      level: NiveauCompetence.INTERMEDIAIRE,
    };

    it('should create an etudiant-skill when it does not already exist', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockEtudiantSkill);
      repository.save.mockResolvedValue(mockEtudiantSkill);

      const result = await service.create(dto, currentUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { etudiantId: dto.etudiantId, skillId: dto.skillId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockEtudiantSkill);
      expect(result).toEqual(mockEtudiantSkill);
    });

    it('should throw ConflictException when the association already exists', async () => {
      repository.findOne.mockResolvedValue(mockEtudiantSkill);

      await expect(service.create(dto, currentUser)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all etudiant-skills with relations', async () => {
      repository.find.mockResolvedValue([mockEtudiantSkill]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: { etudiant: true, skill: true },
      });
      expect(result).toEqual([mockEtudiantSkill]);
    });
  });

  describe('findAllByEtudiant', () => {
    it('should return skills for a given etudiant', async () => {
      repository.find.mockResolvedValue([mockEtudiantSkill]);

      const result = await service.findAllByEtudiant('etu-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { etudiantId: 'etu-1' },
        relations: { skill: true },
      });
      expect(result).toEqual([mockEtudiantSkill]);
    });
  });

  describe('findOne', () => {
    it('should return one etudiant-skill', async () => {
      repository.findOne.mockResolvedValue(mockEtudiantSkill);

      const result = await service.findOne('etu-1', 'skill-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { etudiantId: 'etu-1', skillId: 'skill-1' },
        relations: { etudiant: true, skill: true },
      });
      expect(result).toEqual(mockEtudiantSkill);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('etu-1', 'skill-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update the level of an existing etudiant-skill', async () => {
      const updated = { ...mockEtudiantSkill, level: NiveauCompetence.AVANCE };
      repository.findOne.mockResolvedValue(mockEtudiantSkill);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(
        'etu-1',
        'skill-1',
        { level: NiveauCompetence.AVANCE },
        currentUser,
      );

      expect(result.level).toEqual(NiveauCompetence.AVANCE);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a non-existing association', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          'etu-1',
          'skill-1',
          { level: NiveauCompetence.AVANCE },
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete an existing etudiant-skill', async () => {
      repository.findOne.mockResolvedValue(mockEtudiantSkill);
      repository.remove.mockResolvedValue(mockEtudiantSkill);

      await service.remove('etu-1', 'skill-1', currentUser);

      expect(mockEtudiantSkill.statut).toEqual(Statut.SUPPRIME);
      expect(mockEtudiantSkill.updated_by).toEqual(currentUser.id);
      expect(repository.remove).toHaveBeenCalledWith(mockEtudiantSkill);
    });

    it('should throw NotFoundException when removing a non-existing association', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('etu-1', 'skill-1', currentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
