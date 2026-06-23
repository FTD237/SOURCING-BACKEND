import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';
import { Statut } from '../common/enum/statut.enum';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly expRepo: Repository<Experience>,
  ) {}

  async create(dto: CreateExperienceDto): Promise<Experience> {
    const exp = this.expRepo.create(dto);
    return this.expRepo.save(exp);
  }

  async findAll(): Promise<Experience[]> {
    return this.expRepo.find({ relations: { etudiant: true } });
  }

  async findByEtudiant(studentId: string): Promise<Experience[]> {
    return this.expRepo.find({
      where: { student_id: studentId },
      relations: { etudiant: true },
    });
  }

  async findOne(id: string): Promise<Experience> {
    const exp = await this.expRepo.findOne({
      where: { id },
      relations: { etudiant: true },
    });
    if (!exp) throw new NotFoundException(`Expérience #${id} introuvable`);
    return exp;
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<Experience> {
    const exp = await this.findOne(id);
    Object.assign(exp, dto);
    return this.expRepo.save(exp);
  }

  async remove(id: string): Promise<void> {
    const exp = await this.findOne(id);
    exp.statut = Statut.SUPPRIME;
    exp.dte_suppression = new Date();
    await this.expRepo.save(exp);
  }
}
