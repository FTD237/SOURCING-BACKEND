// etudiant-skill.controller.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { EtudiantSkillController } from './etudiant-skill.controller';
import { EtudiantSkillService } from './etudiant-skill.service';
import { EtudiantSkill } from './etudiant-skill.entity';
import { NiveauCompetence } from '../common/enum/niveau-competence.enum';

describe('EtudiantSkillController', () => {
  let controller: EtudiantSkillController;
  let service: jest.Mocked<EtudiantSkillService>;
  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockEtudiantSkill = {
    etudiantId: 'etu-1',
    skillId: 'skill-1',
    level: NiveauCompetence.INTERMEDIAIRE,
  } as EtudiantSkill;

  const mockEtudiantSkillList: EtudiantSkill[] = [mockEtudiantSkill];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EtudiantSkillController],
      providers: [
        {
          provide: EtudiantSkillService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllByEtudiant: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EtudiantSkillController>(EtudiantSkillController);
    service = module.get(EtudiantSkillService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const dto = {
        etudiantId: 'etu-1',
        skillId: 'skill-1',
        level: NiveauCompetence.INTERMEDIAIRE,
      };
      service.create.mockResolvedValue(mockEtudiantSkill);

      const result = await controller.create(dto, currentUser);

      expect(service.create).toHaveBeenCalledWith(dto, currentUser);
      expect(result).toEqual(mockEtudiantSkill);
    });
  });

  describe('findAll', () => {
    it('should return an array of etudiant-skills', async () => {
      service.findAll.mockResolvedValue(mockEtudiantSkillList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockEtudiantSkillList);
    });
  });

  describe('findAllByEtudiant', () => {
    it('should return skills for an etudiant', async () => {
      service.findAllByEtudiant.mockResolvedValue(mockEtudiantSkillList);

      const result = await controller.findAllByEtudiant('etu-1');

      expect(service.findAllByEtudiant).toHaveBeenCalledWith('etu-1');
      expect(result).toEqual(mockEtudiantSkillList);
    });
  });

  describe('findOne', () => {
    it('should return one etudiant-skill', async () => {
      service.findOne.mockResolvedValue(mockEtudiantSkill);

      const result = await controller.findOne('etu-1', 'skill-1');

      expect(service.findOne).toHaveBeenCalledWith('etu-1', 'skill-1');
      expect(result).toEqual(mockEtudiantSkill);
    });
  });

  describe('update', () => {
    it('should update and return the etudiant-skill', async () => {
      const updated = {
        ...mockEtudiantSkill,
        level: NiveauCompetence.AVANCE,
      } as EtudiantSkill;
      service.update.mockResolvedValue(updated);

      const result = await controller.update(
        'etu-1',
        'skill-1',
        { level: NiveauCompetence.AVANCE },
        currentUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        'etu-1',
        'skill-1',
        { level: NiveauCompetence.AVANCE },
        currentUser,
      );
      expect(result.level).toEqual(NiveauCompetence.AVANCE);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('etu-1', 'skill-1', currentUser);

      expect(service.remove).toHaveBeenCalledWith(
        'etu-1',
        'skill-1',
        currentUser,
      );
    });
  });
});
