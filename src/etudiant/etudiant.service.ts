import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etudiant } from './etudiant.entity';
import { CreateEtudiantDto, UpdateEtudiantDto } from './etudiant.dto';

@Injectable()
export class EtudiantService {
  constructor(
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
  ) {}

  async create(dto: CreateEtudiantDto): Promise<Etudiant> {
    const etudiant = this.etudiantRepo.create(dto);
    return this.etudiantRepo.save(etudiant);
  }

  async findAll(): Promise<Etudiant[]> {
    return this.etudiantRepo.find({ relations: { user: true } });
  }

  async findOne(id: number): Promise<Etudiant> {
    const etudiant = await this.etudiantRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!etudiant) throw new NotFoundException(`Etudiant #${id} introuvable`);
    return etudiant;
  }

  async update(id: number, dto: UpdateEtudiantDto): Promise<Etudiant> {
    const etudiant = await this.findOne(id);
    Object.assign(etudiant, dto);
    return this.etudiantRepo.save(etudiant);
  }

  // async findByAttributes()

  async remove(id: number): Promise<void> {
    const etudiant = await this.findOne(id);
    etudiant.statut = 'supprime';
    etudiant.dte_suppression = new Date();
    await this.etudiantRepo.save(etudiant);
  }
}
