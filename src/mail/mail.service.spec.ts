import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    mailerService = { sendMail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends a templated mail with the given options', async () => {
    await service.sendMail({
      to: 'test@example.com',
      subject: 'Sujet',
      template: 'welcome',
      context: { nom: 'Jean' },
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Sujet',
      template: 'welcome',
      context: { nom: 'Jean' },
    });
  });

  it('sends a welcome mail', async () => {
    await service.sendWelcomeMail('test@example.com', 'Jean');

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        template: 'welcome',
        context: { nom: 'Jean' },
      }),
    );
  });

  it('sends a account activation mail', async () => {
    await service.sendAccountActivationMail(
      'test@example.com',
      'Jean',
      'localhost:5473/activation/link',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Bienvenue - Activez votre compte',
        template: 'welcome',
        context: {
          nom: 'Jean',
          lien_activation: 'localhost:5473/activation/link',
          duree_validite: '24 heures',
          annee: new Date().getFullYear(),
        },
      }),
    );
  });

  it('sends a password reset mail', async () => {
    await service.sendPasswordResetMail(
      'test@example.com',
      'https://app/reset?token=abc',
      'Jean',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        template: 'reset-password',
        context: { nom: 'Jean', resetLink: 'https://app/reset?token=abc' },
      }),
    );
  });

  it('propagates and logs errors from the underlying transport', async () => {
    const error = new Error('SMTP down');
    mailerService.sendMail.mockRejectedValueOnce(error);

    await expect(
      service.sendMail({
        to: 'test@example.com',
        subject: 'Sujet',
        template: 'welcome',
      }),
    ).rejects.toThrow('SMTP down');
  });
});
