import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Etudiant } from './etudiant.entity';
import {
  CreateEtudiantDto,
  CreateEtudiantResponseDto,
  UpdateEtudiantDto,
} from './dto/etudiant.dto';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { generatePassword } from '../common/utils/generate-password';
import { Statut } from '../common/enum/statut.enum';
import { ActivationTokenService } from '../common/services/activation-token.service';
import { MailService } from '../mail/mail.service';
import { Roles } from '../common/enum/roles.enum';
import { LinkCheckerService } from '../common/services/link-checker.service';
import { JobseekerService } from '../jobseeker/jobseeker.service';
import { paginer, ResultatPagine } from '../common/pagination';
import { RechercheEtudiantDto } from './dto/recherche.etudiant.dto';
import { CreateEtudiantsBulkDto } from './dto/create-etudiant-bulk.dto';
import { randomBytes } from 'node:crypto';

/** Échappe % et _ pour une recherche "contient" sans jokers involontaires. */
const contient = (valeur: string): string =>
  `%${valeur.trim().replace(/[\\%_]/g, '\\$&')}%`; // NOSONAR

@Injectable()
class EtudiantService {
  /** Rôles autorisés à consulter les étudiants supprimés. */
  private static readonly ROLES_VOIR_SUPPRIMES: Roles[] = [
    Roles.ADMIN,
    Roles.MANAGER,
    Roles.SUPERADMIN,
  ];

  constructor(
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly activationTokenService: ActivationTokenService,
    private readonly mailService: MailService,
    private readonly linkCheckerService: LinkCheckerService,
    private readonly jobseekerService: JobseekerService,
  ) {}
  private readonly logger = new Logger(EtudiantService.name);

  async create(
    dto: CreateEtudiantDto,
    currentUser: { id: string; email: string },
  ): Promise<CreateEtudiantResponseDto> {
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser)
      ExceptionFactory.businessConflict(
        'Etudiant',
        `Un utilisateur avec l'email ${dto.email} existe déjà`,
      );

    const roleEtudiant = await this.roleRepo.findOne({
      where: { nom: Roles.ETUDIANT },
    });

    if (!roleEtudiant)
      ExceptionFactory.notFound(
        'Le rôle "etudiant" n\'existe pas. Veuillez le créer avant',
      );

    // Seuls les liens renseignés sont vérifiés (validateLinksOrThrow ignore les vides)
    if (dto.liens) {
      await this.linkCheckerService.validateLinksOrThrow(dto.liens);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let rawToken: string;
    let savedUser: User;
    let savedEtudiant: Etudiant;

    try {
      const generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const createdBy = currentUser.id;

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        id_role: roleEtudiant.id,
        statut: Statut.EN_ATTENTE_ACTIVATION,
        create_by: createdBy,
      });

      savedUser = await queryRunner.manager.save(user);

      const etudiant = queryRunner.manager.create(Etudiant, {
        userId: savedUser.id,
        matricule: dto.matricule,
        promotionId: dto.promotionId,
        annee_acad: dto.annee_acad || new Date().getFullYear().toString(),
        is_job_seeker: dto.is_job_seeker || false,
        star_rate: dto.star_rate || 0,
        statut: Statut.ACTIF,
        create_by: createdBy,
        dte_creation: new Date(),
        bio: dto.bio,
        liens: dto.liens,
        tools: dto.tools,
        nationality: dto.nationality,
        main_domain: dto.main_domain,
        phone_number: dto.phone_number,
        languages: dto.languages,
        avatar_id: dto.avatar_id,
      });

      savedEtudiant = await queryRunner.manager.save(etudiant);

      if (savedEtudiant.is_job_seeker) {
        await this.jobseekerService.activerDans(
          queryRunner.manager,
          savedEtudiant.id,
          dto.jobseeker ?? {},
          currentUser,
        );
      }

      rawToken = await this.activationTokenService.createAndSave(
        savedUser.id,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      ExceptionFactory.database(error, 'Etudiant');
    } finally {
      await queryRunner.release();
    }

    try {
      const lienActivation =
        this.activationTokenService.buildActivationLink(rawToken);
      await this.mailService.sendAccountActivationMail(
        savedUser.email,
        savedUser.nom,
        lienActivation,
      );
    } catch (error) {
      this.logger.error(
        `Échec de l'envoi de l'email d'activation à ${savedUser.email}`,
        error,
      );
    }

    return {
      user: savedUser,
      etudiant: savedEtudiant,
    };
  }

  async createBulk(
    dto: CreateEtudiantsBulkDto,
    currentUser: { id: string },
  ): Promise<{ total: number; crees: number }> {
    const lignes = dto.etudiants.map((l) => ({
      ...l,
      email: l.email.trim().toLowerCase(),
      matricule: l.matricule.trim(),
    }));

    const erreurs: { ligne: number; message: string }[] = [];
    const ligneExcel = (i: number) => i + 2; // ligne 1 = en-têtes

    // 1. doublons dans le fichier (email + matricule)
    const detecterDoublons = (
      cle: 'email' | 'matricule',
      libelle: string,
    ): Set<string> => {
      const vus = new Map<string, number>();
      lignes.forEach((l, i) => {
        const v = l[cle];
        if (vus.has(v)) {
          erreurs.push({
            ligne: ligneExcel(i),
            message: `${libelle} en double dans le fichier (déjà ligne ${ligneExcel(vus.get(v)!)}) : ${v}`,
          });
        } else {
          vus.set(v, i);
        }
      });
      return new Set(vus.keys());
    };
    const emails = detecterDoublons('email', 'Email');
    const matricules = detecterDoublons('matricule', 'Matricule');

    // 2. doublons en base
    const [usersExistants, etudiantsExistants] = await Promise.all([
      this.userRepo.find({
        where: { email: In([...emails]) },
        select: { email: true },
      }),
      this.etudiantRepo.find({
        where: { matricule: In([...matricules]) },
        select: { matricule: true },
      }),
    ]);
    const emailsPris = new Set(usersExistants.map((u) => u.email));
    const matriculesPris = new Set(etudiantsExistants.map((e) => e.matricule));

    lignes.forEach((l, i) => {
      if (emailsPris.has(l.email))
        erreurs.push({
          ligne: ligneExcel(i),
          message: `Email déjà utilisé : ${l.email}`,
        });
      if (matriculesPris.has(l.matricule))
        erreurs.push({
          ligne: ligneExcel(i),
          message: `Matricule déjà utilisé : ${l.matricule}`,
        });
    });

    if (erreurs.length) {
      ExceptionFactory.badRequest(
        'Import refusé : corrigez les lignes en erreur',
      );
    }

    // 3. rôle étudiant (à adapter selon la colonne qui identifie vos rôles)
    const roleEtudiant = await this.roleRepo.findOne({
      where: { nom: Roles.ETUDIANT },
    });
    if (!roleEtudiant) {
      ExceptionFactory.badRequest('Le rôle étudiant est introuvable');
    }

    // 4. insertion atomique
    await this.dataSource.transaction(async (manager) => {
      for (const l of lignes) {
        const password = await bcrypt.hash(randomBytes(8).toString('hex'), 10);

        const user = await manager.save(
          manager.create(User, {
            email: l.email,
            nom: l.nom,
            prenom: l.prenom,
            password,
            id_role: roleEtudiant.id,
            create_by: currentUser.id,
            dte_creation: new Date(),
          }),
        );

        await manager.save(
          manager.create(Etudiant, {
            userId: user.id,
            promotionId: l.promotionId,
            matricule: l.matricule,
            annee_acad: l.annee_acad,
            nationality: l.nationality,
            scholar_level: l.scholar_level, // le défaut de l'entité s'applique si undefined
            phone_number: l.phone_number,
            main_domain: l.main_domain,
            create_by: currentUser.id,
            dte_creation: new Date(),
          }),
        );
      }
    });

    return { total: lignes.length, crees: lignes.length };
  }

  /**
   * Liste paginée et filtrable des étudiants.
   *
   * - Les étudiants supprimés sont exclus par défaut.
   * - `inclureSupprimes` ou `statut = SUPPRIME` les révèle, mais seulement
   *   pour ADMIN, MANAGER et SUPERADMIN (403 sinon).
   * - Les filtres se combinent (ET) ; `q` cherche dans le nom, prénom, email
   *   et matricule (OU).
   */
  async findAll(
    filtre: RechercheEtudiantDto,
    currentUser: { id: string; email: string; role: Roles },
  ): Promise<ResultatPagine<Etudiant>> {
    const { page, limite } = filtre;

    this.verifierAccesSupprimes(filtre, currentUser);

    const qb = this.etudiantRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .leftJoinAndSelect('e.jobseeker', 'j');

    this.appliquerFiltreStatut(qb, filtre);
    this.appliquerFiltresIdentifiants(qb, filtre);
    this.appliquerFiltresUser(qb, filtre);
    this.appliquerFiltresEtudiant(qb, filtre);
    this.appliquerRechercheLibre(qb, filtre);

    const resultat = await qb
      .orderBy('e.dte_creation', 'DESC')
      .skip((page - 1) * limite)
      .take(limite)
      .getManyAndCount();

    return paginer(resultat, filtre);
  }

  // ---------------------------------------------------------------------------
  // Méthodes privées extraites
  // ---------------------------------------------------------------------------

  private verifierAccesSupprimes(
    filtre: RechercheEtudiantDto,
    currentUser: { role: Roles },
  ): void {
    const veutSupprimes =
      filtre.inclureSupprimes === true || filtre.statut === Statut.SUPPRIME;

    if (
      veutSupprimes &&
      !EtudiantService.ROLES_VOIR_SUPPRIMES.includes(currentUser.role)
    ) {
      ExceptionFactory.forbidden(
        'Seuls un admin ou un manager peuvent consulter les étudiants supprimés',
      );
    }
  }

  private appliquerFiltreStatut(
    qb: SelectQueryBuilder<Etudiant>,
    filtre: RechercheEtudiantDto,
  ): void {
    if (filtre.statut) {
      qb.andWhere('e.statut = :statut', { statut: filtre.statut });
    } else if (!filtre.inclureSupprimes) {
      qb.andWhere('e.statut <> :supprime', { supprime: Statut.SUPPRIME });
    }
  }

  private appliquerFiltresIdentifiants(
    qb: SelectQueryBuilder<Etudiant>,
    filtre: RechercheEtudiantDto,
  ): void {
    if (filtre.id) qb.andWhere('e.id = :id', { id: filtre.id });
    if (filtre.userId)
      qb.andWhere('e.userId = :userId', { userId: filtre.userId });
    if (filtre.promotionId)
      qb.andWhere('e.promotionId = :promotionId', {
        promotionId: filtre.promotionId,
      });
  }

  private appliquerFiltresUser(
    qb: SelectQueryBuilder<Etudiant>,
    filtre: RechercheEtudiantDto,
  ): void {
    if (filtre.nom)
      qb.andWhere('LOWER(u.nom) LIKE LOWER(:nom)', {
        nom: contient(filtre.nom),
      });
    if (filtre.prenom)
      qb.andWhere('LOWER(u.prenom) LIKE LOWER(:prenom)', {
        prenom: contient(filtre.prenom),
      });
    if (filtre.email)
      qb.andWhere('LOWER(u.email) LIKE LOWER(:email)', {
        email: contient(filtre.email),
      });
  }

  private appliquerFiltresEtudiant(
    qb: SelectQueryBuilder<Etudiant>,
    filtre: RechercheEtudiantDto,
  ): void {
    if (filtre.matricule)
      qb.andWhere('LOWER(e.matricule) LIKE LOWER(:matricule)', {
        matricule: contient(filtre.matricule),
      });
    if (filtre.is_job_seeker !== undefined)
      qb.andWhere('e.is_job_seeker = :jobseeker', {
        jobseeker: filtre.is_job_seeker,
      });
  }

  private appliquerRechercheLibre(
    qb: SelectQueryBuilder<Etudiant>,
    filtre: RechercheEtudiantDto,
  ): void {
    if (!filtre.q) return;
    qb.andWhere(
      new Brackets((b) =>
        b
          .where('LOWER(u.nom) LIKE LOWER(:q)')
          .orWhere('LOWER(u.prenom) LIKE LOWER(:q)')
          .orWhere('LOWER(u.email) LIKE LOWER(:q)')
          .orWhere('LOWER(e.matricule) LIKE LOWER(:q)'),
      ),
      { q: contient(filtre.q) },
    );
  }

  async findOne(id: string): Promise<Etudiant> {
    const etudiant = await this.etudiantRepo.findOne({
      where: { id },
      relations: { user: true, jobseeker: true },
    });
    if (!etudiant)
      ExceptionFactory.notFound('Etudiant', `Etudiant #${id} introuvable`);
    return etudiant;
  }

  async update(
    id: string,
    dto: UpdateEtudiantDto,
    currentUser: { id: string; email: string },
  ): Promise<Etudiant | null> {
    const etudiant = await this.etudiantRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!etudiant) ExceptionFactory.notFound(`Etudiant`, id);

    // Ici is_job_seeker et jobseeker sortent de l'update générique :
    // c'est JobseekerService qui écrit le flag, pour qu'il reste cohérent avec la table.
    // Liens en sort aussi : on écrit la version fusionnée, pas celle du dto
    // (sinon un lien seul écraserait les autres).
    const { nom, prenom, is_job_seeker, jobseeker, liens, ...etudiantFields } =
      dto;

    let liensFusionnes: Etudiant['liens'] | undefined;
    if (liens) {
      const envoyes = Object.fromEntries(
        Object.entries(liens).filter(([, v]) => v !== undefined),
      );
      // on ne vérifie que les liens envoyés, pas ceux déjà en base
      await this.linkCheckerService.validateLinksOrThrow(envoyes);
      liensFusionnes = { ...etudiant.liens, ...envoyes };
    }

    await this.dataSource.transaction(async (manager) => {
      if (nom || prenom) {
        await manager.update(User, etudiant.user.id, {
          ...(nom && { nom }),
          ...(prenom && { prenom }),
        });
      }

      await manager.update(Etudiant, id, {
        ...etudiantFields,
        ...(liensFusionnes && { liens: liensFusionnes }),
        updated_by: currentUser.id,
        dte_modif: new Date(),
      });

      if (is_job_seeker === false) {
        if (etudiant.is_job_seeker) {
          await this.jobseekerService.desactiverDans(manager, id, currentUser);
        }
      } else if (
        is_job_seeker === true ||
        (jobseeker && etudiant.is_job_seeker)
      ) {
        // passage à true, ou mise à jour des détails d'un étudiant déjà en recherche
        await this.jobseekerService.activerDans(
          manager,
          id,
          jobseeker ?? {},
          currentUser,
        );
      }
    });

    return this.etudiantRepo.findOne({
      where: { id },
      relations: { user: true, jobseeker: true },
    });
  }

  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const etudiant = await this.findOne(id);
    etudiant.statut = Statut.SUPPRIME;
    etudiant.dte_suppression = new Date();
    etudiant.updated_by = currentUser.id;
    try {
      await this.etudiantRepo.save(etudiant);
    } catch (error) {
      ExceptionFactory.database(error, 'Etudiant');
    }
  }
}

export default EtudiantService;
