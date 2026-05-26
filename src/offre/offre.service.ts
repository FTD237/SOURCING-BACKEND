import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offre } from './offre.entity';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';

@Injectable()
export class OffreService {
  constructor(
    @InjectRepository(Offre)
    private readonly offreRepo: Repository<Offre>,
  ) {}

  async create(dto: CreateOffreDto): Promise<Offre> {
    const offre = this.offreRepo.create(dto);
    return this.offreRepo.save(offre);
  }

  async findAll(): Promise<Offre[]> {
    return this.offreRepo.find();
  }

  async findOne(id: number): Promise<Offre> {
    const offre = await this.offreRepo.findOne({ where: { id } });
    if (!offre) throw new NotFoundException(`Offre #${id} introuvable`);
    return offre;
  }

  async update(id: number, dto: UpdateOffreDto): Promise<Offre> {
    const offre = await this.findOne(id);
    Object.assign(offre, dto);
    return this.offreRepo.save(offre);
  }

  async remove(id: number): Promise<void> {
    const offre = await this.findOne(id);
    offre.statut = 'supprime';
    offre.dte_suppression = new Date();
    await this.offreRepo.save(offre);
  }
}
