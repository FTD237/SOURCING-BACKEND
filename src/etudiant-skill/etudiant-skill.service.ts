// etudiant-skill.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EtudiantSkill } from './etudiant-skill.entity';
import { CreateEtudiantSkillDto } from './dto/create-etudiant-skill.dto';
import { UpdateEtudiantSkillDto } from './dto/update-etudiant-skill.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { Statut } from '../common/enum/statut.enum';

@Injectable()
export class EtudiantSkillService {
  constructor(
    @InjectRepository(EtudiantSkill)
    private readonly etudiantSkillRepository: Repository<EtudiantSkill>,
  ) {}

  async create(
    dto: CreateEtudiantSkillDto,
    currentUser: { id: string; email: string },
  ): Promise<EtudiantSkill> {
    const existing = await this.etudiantSkillRepository.findOne({
      where: { etudiantId: dto.etudiantId, skillId: dto.skillId },
    });

    if (existing) {
      ExceptionFactory.conflict('Ce skill est déjà associé à cet étudiant');
    }

    const etudiantSkill = this.etudiantSkillRepository.create(dto);
    etudiantSkill.create_by = currentUser.id;
    etudiantSkill.dte_creation = new Date();
    return this.etudiantSkillRepository.save(etudiantSkill);
  }

  async findAll(): Promise<EtudiantSkill[]> {
    return this.etudiantSkillRepository.find({
      relations: { etudiant: true, skill: true },
    });
  }

  async findAllByEtudiant(etudiantId: string): Promise<EtudiantSkill[]> {
    return this.etudiantSkillRepository.find({
      where: { etudiantId },
      relations: { skill: true },
    });
  }

  async findOne(etudiantId: string, skillId: string): Promise<EtudiantSkill> {
    const etudiantSkill = await this.etudiantSkillRepository.findOne({
      where: { etudiantId, skillId },
      relations: { etudiant: true, skill: true },
    });

    if (!etudiantSkill) {
      ExceptionFactory.notFound(
        'Aucune compétence trouvée pour cet étudiant et ce skill',
      );
    }

    return etudiantSkill;
  }

  async update(
    etudiantId: string,
    skillId: string,
    dto: UpdateEtudiantSkillDto,
    currentUser: { id: string; email: string },
  ): Promise<EtudiantSkill> {
    const etudiantSkill = await this.findOne(etudiantId, skillId);
    etudiantSkill.level = dto.level;
    etudiantSkill.updated_by = currentUser.id;
    etudiantSkill.dte_modif = new Date();
    return this.etudiantSkillRepository.save(etudiantSkill);
  }

  async remove(
    etudiantId: string,
    skillId: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const etudiantSkill = await this.findOne(etudiantId, skillId);
    etudiantSkill.statut = Statut.SUPPRIME;
    etudiantSkill.updated_by = currentUser.id;
    etudiantSkill.dte_suppression = new Date();
    await this.etudiantSkillRepository.remove(etudiantSkill);
  }
}
