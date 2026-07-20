import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './formation.entity';
import { CreateFormationDto, UpdateFormationDto } from './formation.dto';
import { Statut } from '../common/enum/statut.enum';

@Injectable()
export class FormationService {
  constructor(
    @InjectRepository(Formation)
    private readonly formationRepo: Repository<Formation>,
  ) {}

  async create(dto: CreateFormationDto): Promise<Formation> {
    const formation = this.formationRepo.create(dto);
    return this.formationRepo.save(formation);
  }

  async findAll(): Promise<Formation[]> {
    return this.formationRepo.find();
  }

  async findOne(id: string): Promise<Formation> {
    const formation = await this.formationRepo.findOne({ where: { id } });
    if (!formation) throw new NotFoundException(`Formation #${id} introuvable`);
    return formation;
  }

  async update(id: string, dto: UpdateFormationDto): Promise<Formation> {
    const formation = await this.findOne(id);
    Object.assign(formation, dto);
    return this.formationRepo.save(formation);
  }

  async remove(id: string): Promise<void> {
    const formation = await this.findOne(id);
    formation.statut = Statut.SUPPRIME;
    formation.dte_suppression = new Date();
    await this.formationRepo.save(formation);
  }
}
