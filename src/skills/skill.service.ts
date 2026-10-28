import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
import { Statut } from '../common/enum/statut.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async create(
    dto: CreateSkillDto,
    currentUser: { id: string; email: string },
  ): Promise<Skill> {
    const exists = await this.skillRepo.findOne({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException(`Skill "${dto.nom}" existe déjà`);
    const skill = this.skillRepo.create(dto);
    skill.create_by = currentUser.id;
    skill.dte_creation = new Date();
    return this.skillRepo.save(skill);
  }

  async findAll(): Promise<Skill[]> {
    return this.skillRepo.find();
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) throw new NotFoundException(`Skill #${id} introuvable`);
    return skill;
  }

  async update(
    id: string,
    dto: UpdateSkillDto,
    currentUser: { id: string; email: string },
  ): Promise<Skill> {
    const skill = await this.findOne(id);
    skill.updated_by = currentUser.id;
    skill.dte_modif = new Date();
    Object.assign(skill, dto);
    return this.skillRepo.save(skill);
  }

  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const skill = await this.findOne(id);
    skill.statut = Statut.SUPPRIME;
    skill.dte_suppression = new Date();
    skill.updated_by = currentUser.id;
    try {
      await this.skillRepo.remove(skill);
    } catch (error) {
      ExceptionFactory.database(error, 'Skill');
    }
  }
}
