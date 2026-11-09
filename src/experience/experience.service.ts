import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { Statut } from '../common/enum/statut.enum';
import { FileEntity } from '../file/file.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { RechercheEtudiantDto } from '../etudiant/dto/recherche.etudiant.dto';
import { Roles } from '../common/enum/roles.enum';
import { paginer, ResultatPagine } from '../common/pagination';
import { RechercheExperienceDTO } from './dto/recherche.experience.dto';

@Injectable()
export class ExperienceService {
  /** Rôles autorisés à consulter les expériences supprimés. */
  private static readonly ROLES_VOIR_SUPPRIMES: Roles[] = [
    Roles.ADMIN,
    Roles.MANAGER,
    Roles.SUPERADMIN,
  ];

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

  // async findAll(): Promise<Experience[]> {
  //   const experiences = await this.expRepo.find({
  //     relations: ExperienceService.RELATIONS,
  //   });
  //   return this.attachMedia(experiences);
  // }

  async findAll(
    filtre: RechercheEtudiantDto,
    currentUser: { id: string; email: string; role: Roles },
  ): Promise<ResultatPagine<Experience>> {
    const { page, limite } = filtre;

    this.verifierAccesSupprimes(filtre, currentUser);

    const qb = this.expRepo.createQueryBuilder('e');

    this.appliquerFiltresIdentifiants(qb, filtre);
    this.appliquerFiltresIdentifiants(qb, filtre);
    this.appliquerFiltreStatut(qb, filtre);

    const resultat = await qb
      .orderBy('e.dte_creation', 'DESC')
      .skip((page - 1) * limite)
      .take(limite)
      .getManyAndCount();

    return paginer(resultat, filtre);
  }

  private verifierAccesSupprimes(
    filtre: RechercheExperienceDTO,
    currentUser: { role: Roles },
  ): void {
    const veutSupprimes =
      filtre.inclureSupprimes === true || filtre.statut === Statut.SUPPRIME;

    if (
      veutSupprimes &&
      !ExperienceService.ROLES_VOIR_SUPPRIMES.includes(currentUser.role)
    ) {
      ExceptionFactory.forbidden(
        'Seuls un admin ou un manager peuvent consulter les Expériences supprimés',
      );
    }
  }

  private appliquerFiltreStatut(
    qb: SelectQueryBuilder<Experience>,
    filtre: RechercheExperienceDTO,
  ): void {
    if (filtre.statut) {
      qb.andWhere('e.statut = :statut', { statut: filtre.statut });
    } else if (!filtre.inclureSupprimes) {
      qb.andWhere('e.statut <> :supprime', { supprime: Statut.SUPPRIME });
    }
  }

  private appliquerFiltresIdentifiants(
    qb: SelectQueryBuilder<Experience>,
    filtre: RechercheExperienceDTO,
  ): void {
    if (filtre.id) qb.andWhere('e.id = :id', { id: filtre.id });
    if (filtre.idCompany)
      qb.andWhere('e.company_id = :company_id', { id: filtre.idCompany });
    if (filtre.student_id)
      qb.andWhere('e.student_id = :student_id', { id: filtre.student_id });
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
