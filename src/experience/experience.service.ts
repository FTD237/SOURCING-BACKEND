import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { Statut } from '../common/enum/statut.enum';
import { FileEntity } from '../file/file.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

@Injectable()
export class ExperienceService {
  private static readonly RELATIONS = {
    etudiant: { user: true },
    company: true,
  } as const;

  constructor(
    @InjectRepository(Experience)
    private readonly expRepo: Repository<Experience>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  /**
   * 'media` n'est pas une relation TypeORM : on charge les fichiers
   * à partir de `media_ids` et on les rattache à la main.
   */
  private async attachMedia(experiences: Experience[]): Promise<Experience[]> {
    const ids = [...new Set(experiences.flatMap((e) => e.media_ids ?? []))];
    const files = ids.length
      ? await this.fileRepository.find({ where: { id: In(ids) } })
      : [];
    const byId = new Map(files.map((f) => [f.id, f]));

    for (const e of experiences) {
      e.media = (e.media_ids ?? [])
        .map((id) => byId.get(id))
        .filter((f): f is FileEntity => !!f);
    }
    return experiences;
  }

  private async checkMediaExist(mediaIds?: string[]): Promise<void> {
    if (!mediaIds?.length) return;
    const uniques = [...new Set(mediaIds)];
    const trouves = await this.fileRepository.count({
      where: { id: In(uniques) },
    });
    if (trouves !== uniques.length) {
      ExceptionFactory.badRequest('Un ou plusieurs fichiers sont introuvables');
    }
  }

  async create(
    dto: CreateExperienceDto,
    currentUser: { id: string },
  ): Promise<Experience> {
    await this.checkMediaExist(dto.media_ids);

    const exp = this.expRepo.create(dto);
    exp.create_by = currentUser.id;
    exp.dte_creation = new Date();
    const saved = await this.expRepo.save(exp);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<Experience[]> {
    const experiences = await this.expRepo.find({
      relations: ExperienceService.RELATIONS,
    });
    return this.attachMedia(experiences);
  }

  async findByEtudiant(studentId: string): Promise<Experience[]> {
    const experiences = await this.expRepo.find({
      where: { student_id: studentId },
      relations: ExperienceService.RELATIONS,
    });
    return this.attachMedia(experiences);
  }

  async findOne(id: string): Promise<Experience> {
    const exp = await this.expRepo.findOne({
      where: { id },
      relations: ExperienceService.RELATIONS,
    });
    if (!exp) throw new NotFoundException(`Expérience #${id} introuvable`);
    const [withMedia] = await this.attachMedia([exp]);
    return withMedia;
  }

  async update(
    id: string,
    dto: UpdateExperienceDto,
    currentUser: { id: string },
  ): Promise<Experience> {
    const exp = await this.findOne(id);
    await this.checkMediaExist(dto.media_ids);

    Object.assign(exp, dto);
    exp.dte_modif = new Date();
    exp.updated_by = currentUser.id;
    await this.expRepo.save(exp);

    // recharge pour que `media` reflète les nouveaux `media_ids`
    return this.findOne(id);
  }

  async remove(id: string, currentUser: { id: string }): Promise<void> {
    const exp = await this.findOne(id);
    exp.statut = Statut.SUPPRIME;
    exp.dte_suppression = new Date();
    exp.updated_by = currentUser.id;
    await this.expRepo.save(exp);
  }
}
