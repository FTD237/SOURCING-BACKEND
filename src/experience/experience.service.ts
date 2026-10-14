import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';
import { Statut } from '../common/enum/statut.enum';
import { FileEntity } from '../file/file.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly expRepo: Repository<Experience>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async create(
    dto: CreateExperienceDto,
    currentUser: { id: string },
  ): Promise<Experience> {
    const exp = this.expRepo.create(dto);
    if (dto.media_ids?.length) {
      const trouves = await this.fileRepository.count({
        where: {
          id: In(dto.media_ids),
        },
      });

      if (trouves !== dto.media_ids.length) {
        ExceptionFactory.badRequest(
          'Un ou plusieurs fichiers sont introuvables',
        );
      }
    }
    exp.create_by = currentUser.id;
    exp.dte_creation = new Date();
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

  async update(
    id: string,
    dto: UpdateExperienceDto,
    currentUser: { id: string },
  ): Promise<Experience> {
    const exp = await this.findOne(id);
    if (dto.media_ids?.length) {
      const trouves = await this.fileRepository.count({
        where: {
          id: In(dto.media_ids),
        },
      });

      if (trouves !== dto.media_ids.length) {
        ExceptionFactory.badRequest(
          'Un ou plusieurs fichiers sont introuvables',
        );
      }
    }
    exp.dte_modif = new Date();
    exp.updated_by = currentUser.id;
    Object.assign(exp, dto);
    return this.expRepo.save(exp);
  }

  async remove(id: string, currentUser: { id: string }): Promise<void> {
    const exp = await this.findOne(id);
    exp.statut = Statut.SUPPRIME;
    exp.dte_suppression = new Date();
    exp.updated_by = currentUser.id;
    await this.expRepo.save(exp);
  }
}
