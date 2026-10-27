import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { User } from '../user/user.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { MailService } from '../mail/mail.service';
import { Etudiant } from '../etudiant/etudiant.entity';
import Company from '../company/company.entity';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Statut } from '../common/enum/statut.enum';
import { ActivationTokenService } from '../common/services/activation-token.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepository: Repository<Etudiant>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly activationTokenService: ActivationTokenService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      ExceptionFactory.badRequest('Email ou mot de passe incorect');

    this.assertCompteConnectable(user);

    const access_token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role.nom,
    });

    const roleSpecificId = await this.getRoleSpecificId(user.id, user.role.nom);

    return {
      access_token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        ...roleSpecificId,
      },
    };
  }

  private assertCompteConnectable(user: User) {
    if (user.statut === Statut.ACTIF) return;

    if (user.statut === Statut.EN_ATTENTE_ACTIVATION)
      ExceptionFactory.forbidden(
        "Votre compte n'est pas encore activé. Utilisez le lien d'activation reçu par mail.",
      );

    if (user.statut === Statut.INACTIF)
      ExceptionFactory.forbidden(
        'Votre compte est désactivé. Contactez un administrateur.',
      );

    ExceptionFactory.badRequest('Email ou mot de passe incorect');
  }

  /**
   * @description Active un compte : Consomme le token d'activation, enregistre le mot de passe
   * Choisi et passe le statut à ACTIF, le tout dans une transaction
   * (Si une étape échoue, le token n'est pas consommé)
   * @private
   * @param token
   * @param password
   */
  async activateAccount(token: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.dataSource.transaction(async (manager) => {
      const userId = await this.activationTokenService.consume(token, manager);
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) ExceptionFactory.notFound("Lien d'activation invalide");

      if (user.statut !== Statut.EN_ATTENTE_ACTIVATION)
        ExceptionFactory.badRequest(
          "Ce compte n'est pas en attente d'activation",
        );

      await manager.update(User, userId, {
        password: hashedPassword,
        statut: Statut.ACTIF,
        updated_by: userId,
        dte_modif: new Date(),
      });
    });
  }

  /**
   * @description Renvoie un lien d'activation (lien expiré ou perdu).
   * Réponse volontairement identique que le compte existe ou non.
   * @private
   * @param email
   */
  async resendActivation(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (user?.statut !== Statut.EN_ATTENTE_ACTIVATION) return;

    await this.activationTokenService.invalidateAll(user.id);
    const rawToken = await this.activationTokenService.createAndSave(user.id);

    await this.mailService.sendAccountActivationMail(
      user.email,
      user.nom,
      this.activationTokenService.buildActivationLink(rawToken),
    );
  }

  private async getRoleSpecificId(
    userId: string,
    role: RolesEnum,
  ): Promise<Record<string, string>> {
    switch (role) {
      case RolesEnum.ETUDIANT: {
        const etudiant = await this.etudiantRepository.findOne({
          where: { userId },
        });
        return etudiant ? { id_etudiant: etudiant.id } : {};
      }
      case RolesEnum.RH: {
        const company = await this.companyRepository.findOne({
          where: { user_id: userId },
        });
        return company ? { id_company: company.id } : {};
      }
      default:
        return {};
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Réponse volontairement identique que le compte existe ou non,
    // pour ne pas permettre l'énumération des emails inscrits.
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = this.hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetMail(
      user.email,
      resetLink,
      user.nom,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });

    if (
      !user?.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      ExceptionFactory.badRequest('Token invalide ou expiré');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
