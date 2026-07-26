import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockFindOne = jest.fn();
  const mockSave = jest.fn<Promise<User>, [User]>();

  const repoMock = {
    findOne: mockFindOne,
    save: mockSave,
  };

  const jwtServiceMock = { sign: jest.fn().mockReturnValue('signed-jwt') };
  const configServiceMock = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };
  const mailServiceMock = {
    sendPasswordResetMail: jest.fn().mockResolvedValue(undefined),
  };

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-1',
      nom: 'Jean',
      prenom: 'Dupont',
      email: 'jean@example.com',
      password: 'hashed-password',
      resetPasswordToken: null,
      resetPasswordExpires: null,
      role: { nom: 'etudiant' },
      ...overrides,
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('forgotPassword', () => {
    it("ne fait rien (silencieusement) si l'email est inconnu", async () => {
      mockFindOne.mockResolvedValue(null);

      await service.forgotPassword('inconnu@example.com');

      expect(mockSave).not.toHaveBeenCalled();
      expect(mailServiceMock.sendPasswordResetMail).not.toHaveBeenCalled();
    });

    it('génère un token, le persiste hashé et envoie le mail', async () => {
      const user = buildUser();
      mockFindOne.mockResolvedValue(user);

      await service.forgotPassword(user.email);

      expect(mockSave).toHaveBeenCalledTimes(1);
      const savedUser = mockSave.mock.calls[0][0];
      expect(savedUser.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
      expect(savedUser.resetPasswordExpires).toBeInstanceOf(Date);

      expect(mailServiceMock.sendPasswordResetMail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('http://localhost:5173/reset-password?token='),
        user.nom,
      );
    });
  });

  describe('resetPassword', () => {
    it('rejette un token qui ne correspond à aucun utilisateur', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('rejette un token expiré', async () => {
      const user = buildUser({
        resetPasswordToken: 'whatever-hash',
        resetPasswordExpires: new Date(Date.now() - 1000),
      });
      mockFindOne.mockResolvedValue(user);

      await expect(
        service.resetPassword('raw-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('met à jour le mot de passe et invalide le token quand tout est valide', async () => {
      const user = buildUser({
        resetPasswordToken: 'whatever-hash',
        resetPasswordExpires: new Date(Date.now() + 60_000),
      });
      mockFindOne.mockResolvedValue(user);

      await service.resetPassword('raw-token', 'NewPassword123!');

      expect(mockSave).toHaveBeenCalledTimes(1);
      const savedUser = mockSave.mock.calls[0][0];
      expect(savedUser.resetPasswordToken).toBeNull();
      expect(savedUser.resetPasswordExpires).toBeNull();
      expect(await bcrypt.compare('NewPassword123!', savedUser.password)).toBe(
        true,
      );
    });
  });
});
