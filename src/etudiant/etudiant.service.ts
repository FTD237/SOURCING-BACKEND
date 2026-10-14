import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

@Injectable()
class EtudiantService {
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

  async findAll(): Promise<Etudiant[]> {
    return this.etudiantRepo.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Etudiant> {
    const etudiant = await this.etudiantRepo.findOne({
      where: { id },
      relations: { user: true },
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

    if (dto.liens)
      await this.linkCheckerService.validateLinksOrThrow(dto.liens);

    // is_job_seeker et jobseeker sortent de l'update générique :
    // c'est JobseekerService qui écrit le flag, pour qu'il reste cohérent avec la table
    const { nom, prenom, is_job_seeker, jobseeker, ...etudiantFields } = dto;

    await this.dataSource.transaction(async (manager) => {
      if (nom || prenom) {
        await manager.update(User, etudiant.user.id, {
          ...(nom && { nom }),
          ...(prenom && { prenom }),
        });
      }

      await manager.update(Etudiant, id, {
        ...etudiantFields,
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
