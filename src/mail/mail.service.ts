import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface SendTemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: SendTemplateMailOptions): Promise<void> {
    const { to, subject, template, context } = options;

    try {
      await this.mailerService.sendMail({ to, subject, template, context });
    } catch (error) {
      this.logger.error(`Échec de l'envoi du mail à ${to}`, error);
      throw error;
    }
  }

  async sendWelcomeMail(to: string, nom: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Bienvenue',
      template: 'welcome',
      context: { nom },
    });
  }

  async sendPasswordResetMail(
    to: string,
    resetLink: string,
    nom: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      template: 'reset-password',
      context: { nom, resetLink },
    });
  }

  async sendAccountActivationMail(
    to: string,
    nom: string,
    activationLink: string,
    dureeValidite = '24 heures',
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Bienvenue - Activez votre compte',
      template: 'welcome',
      context: {
        nom,
        lien_activation: activationLink,
        duree_validite: dureeValidite,
        annee: new Date().getFullYear(),
      },
    });
  }
}
