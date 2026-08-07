import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './company.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { generatePassword } from '../common/utils/generate-password';
import { Statut } from '../common/enum/statut.enum';
import { Roles } from '../common/enum/roles.enum';
import { ActivationTokenService } from '../common/services/activation-token.service';
import { MailService } from '../mail/mail.service';
import { EtudiantService } from '../etudiant/etudiant.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly activationTokenService: ActivationTokenService,
    private readonly mailService: MailService,
  ) {}
  private readonly logger = new Logger(EtudiantService.name);

  async create(
    dto: CreateCompanyDto,
    currentUser: { id: string; name: string },
  ): Promise<CreateCompanyResponseDto> {
    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      ExceptionFactory.businessConflict(
        'Company',
        `Un utilisateur avec l'email ${dto.email} existe déjà`,
      );
    }

    // 2. Vérifier que le rôle "rh" existe
    const roleCompany = await this.roleRepository.findOne({
      where: { nom: Roles.RH },
    });

    if (!roleCompany) {
      ExceptionFactory.notFound(
        'Le rôle "rh" n\'existe pas. Veuillez le créer avant',
      );
    }

    // 3. Démarrer la transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let rawToken: string;
    let savedUser: User;
    let savedCompany: Company;

    try {
      // 4. Générer le mot de passe
      const generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const createdBy = currentUser.id;

      // 5. Créer l'utilisateur
      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        id_role: roleCompany.id,
        statut: Statut.EN_ATTENTE_ACTIVATION,
        create_by: createdBy,
      });

      savedUser = await queryRunner.manager.save(user);

      // 6. Créer la company
      const company = queryRunner.manager.create(Company, {
        user_id: savedUser.id,
        country_code: dto.country_code,
        statut: Statut.ACTIF,
        create_by: createdBy,
      });

      savedCompany = await queryRunner.manager.save(company);

      // 7. Générer et sauvegarder le token d'activation
      rawToken = await this.activationTokenService.createAndSave(
        savedUser.id,
        queryRunner.manager,
      );

      // 8. Valider la transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // 9. Annuler la transaction en cas d'erreur
      await queryRunner.rollbackTransaction();
      ExceptionFactory.database(error, 'Company');
    } finally {
      // 10. Libérer le queryRunner
      await queryRunner.release();
    }

    // 11. Envoyer l'email d'activation (en dehors de la transaction)
    try {
      const lienActivation =
        this.activationTokenService.buildActivationLink(rawToken);
      await this.mailService.sendAccountActivationMail(
        savedUser.email,
        savedUser.nom,
        lienActivation,
      );
    } catch (error) {
      // 12. Ne pas bloquer la création si l'email échoue, mais logger l'erreur
      this.logger.error(
        `Échec de l'envoi de l'email d'activation à ${savedUser.email}`,
        error,
      );
    }

    // 13. Retourner la réponse
    return {
      user: savedUser,
      company: savedCompany,
    };
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!company)
      ExceptionFactory.notFound('Company', `Entreprises #${id} introuvable`);
    return company;
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    currentUser: { id: string; email: string },
  ): Promise<Company | null> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!company) ExceptionFactory.notFound('Company', id);

    const { nom, prenom, country_code, ...companyFields } = dto;

    if (nom || prenom || country_code) {
      await this.companyRepository.update(company.user.id, {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(country_code && { country_code }),
      });
    }

    await this.companyRepository.update(id, {
      ...companyFields,
      updated_by: currentUser.id,
    });

    return this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const company = await this.findOne(id);
    company.statut = Statut.SUPPRIME;
    company.dte_suppression = new Date();
    company.updated_by = currentUser.id;

    try {
      await this.companyRepository.save(company);
    } catch (error) {
      ExceptionFactory.database(error, 'Company');
    }
  }
}
