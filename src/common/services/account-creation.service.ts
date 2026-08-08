// src/common/services/account-creation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../user/user.entity';
import { Role } from '../../entity/role.entity';
import { generatePassword } from '../utils/generate-password';
import { Statut } from '../enum/statut.enum';
import { Roles } from '../enum/roles.enum';
import { ExceptionFactory } from '../exceptions/exception-factory';
import { ActivationTokenService } from './activation-token.service';
import { MailService } from '../../mail/mail.service';

export interface CreateUserWithActivationParams {
  email: string;
  nom: string;
  prenom: string;
  roleId: string;
  createdBy: string;
  /** Nom de l'entité pour les messages d'erreur (ex: 'Company', 'Etudiant') */
  contextEntity: string;
}

export interface CreateUserWithActivationResult<TEntity> {
  user: User;
  entity: TEntity;
  rawToken: string;
}

/**
 * Regroupe la logique commune à la création de tout compte utilisateur
 * accompagné d'une entité métier (Company, Etudiant, ...) :
 * génération du mot de passe, transaction, token d'activation, envoi d'email.
 *
 * Les services métier (CompanyService, EtudiantService, ...) restent
 * responsables uniquement de : la vérification du rôle attendu et la
 * création de leur entité spécifique via le callback `createBusinessEntity`.
 */
@Injectable()
export class AccountCreationService {
  private readonly logger = new Logger(AccountCreationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly activationTokenService: ActivationTokenService,
    private readonly mailService: MailService,
  ) {}

  async checkEmailAvailable(
    email: string,
    contextEntity: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      ExceptionFactory.businessConflict(
        contextEntity,
        `Un utilisateur avec l'email ${email} existe déjà`,
      );
    }
  }

  async findRoleOrFail(
    roleName: Roles,
    notFoundMessage: string,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { nom: roleName },
    });
    if (!role) {
      ExceptionFactory.notFound(notFoundMessage);
    }
    return role;
  }

  /**
   * Crée l'utilisateur + l'entité métier associée dans une seule transaction,
   * génère le token d'activation, puis tente l'envoi de l'email en dehors de
   * la transaction (un échec d'envoi n'annule jamais la création du compte).
   */
  async createUserWithActivation<TEntity>(
    params: CreateUserWithActivationParams,
    createBusinessEntity: (
      manager: EntityManager,
      savedUser: User,
    ) => Promise<TEntity>,
  ): Promise<CreateUserWithActivationResult<TEntity>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedUser!: User;
    let savedEntity!: TEntity;
    let rawToken!: string;

    try {
      const generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const user = queryRunner.manager.create(User, {
        email: params.email.toLowerCase().trim(),
        password: hashedPassword,
        nom: params.nom,
        prenom: params.prenom,
        id_role: params.roleId,
        statut: Statut.EN_ATTENTE_ACTIVATION,
        create_by: params.createdBy,
      });
      savedUser = await queryRunner.manager.save(user);

      savedEntity = await createBusinessEntity(queryRunner.manager, savedUser);

      rawToken = await this.activationTokenService.createAndSave(
        savedUser.id,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      ExceptionFactory.database(error, params.contextEntity);
    } finally {
      await queryRunner.release();
    }

    await this.sendActivationEmailSafely(savedUser, rawToken);

    return { user: savedUser, entity: savedEntity, rawToken };
  }

  private async sendActivationEmailSafely(
    user: User,
    rawToken: string,
  ): Promise<void> {
    try {
      const lienActivation =
        this.activationTokenService.buildActivationLink(rawToken);
      await this.mailService.sendAccountActivationMail(
        user.email,
        user.nom,
        lienActivation,
      );
    } catch (error) {
      // Ne bloque jamais la création du compte si l'email échoue
      this.logger.error(
        `Échec de l'envoi de l'email d'activation à ${user.email}`,
        error,
      );
    }
  }
}
