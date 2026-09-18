// src/offre/offre.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Offre } from './offre.entity';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';
import { Statut } from '../common/enum/statut.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { Skill } from '../skills/skill.entity';

@Injectable()
export class OffreService {
  constructor(
    @InjectRepository(Offre)
    private readonly offreRepo: Repository<Offre>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async create(
    dto: CreateOffreDto,
    currentUser: { id: string; email: string },
  ): Promise<Offre> {
    const skills = await this.skillRepo.findBy({ id: In(dto.skillIds) });
    if (skills.length !== dto.skillIds.length) {
      ExceptionFactory.notFound('Un ou plusieurs skills sont introuvables');
    }
    const offre = this.offreRepo.create({
      ...dto,
      skills,
    });
    offre.create_by = currentUser.id;
    offre.dte_creation = new Date();
    return this.offreRepo.save(offre);
  }

  async findAll(): Promise<Offre[]> {
    return this.offreRepo.find();
  }

  async findOne(id: string): Promise<Offre> {
    const offre = await this.offreRepo.findOne({ where: { id } });
    if (!offre) {
      ExceptionFactory.notFound(`Offre #${id} introuvable.`);
    }
    return offre;
  }

  async update(
    id: string,
    dto: UpdateOffreDto,
    currentUser: { id: string; email: string },
  ): Promise<Offre> {
    const offre = await this.findOne(id);
    offre.updated_by = currentUser.id;
    offre.dte_modif = new Date();
    Object.assign(offre, dto);
    return this.offreRepo.save(offre);
  }

  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const offre = await this.findOne(id);
    offre.statut = Statut.SUPPRIME;
    offre.dte_suppression = new Date();
    offre.updated_by = currentUser.id;
    try {
      await this.offreRepo.save(offre);
    } catch (error) {
      ExceptionFactory.database(error, 'Offre');
    }
  }
}
