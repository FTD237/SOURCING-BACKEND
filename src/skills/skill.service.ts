import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';

@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async create(dto: CreateSkillDto): Promise<Skill> {
    const exists = await this.skillRepo.findOne({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException(`Skill "${dto.nom}" existe déjà`);
    const skill = this.skillRepo.create(dto);
    return this.skillRepo.save(skill);
  }

  async findAll(): Promise<Skill[]> {
    return this.skillRepo.find();
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) throw new NotFoundException(`Skill #${id} introuvable`);
    return skill;
  }

  async update(id: number, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOne(id);
    Object.assign(skill, dto);
    return this.skillRepo.save(skill);
  }

  async remove(id: number): Promise<void> {
    const skill = await this.findOne(id);
    await this.skillRepo.remove(skill);
  }
}
