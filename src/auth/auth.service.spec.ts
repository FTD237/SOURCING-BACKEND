import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Company } from '../company/company.entity';
import { Role } from '../entity/role.entity';
import { MailService } from '../mail/mail.service';
import { Roles as RolesEnum } from '../common/enum/roles.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserFindOne = jest.fn<Promise<User | null>, [unknown]>();
  const mockUserSave = jest.fn<Promise<User>, [User]>();
  const mockEtudiantFindOne = jest.fn<Promise<Etudiant | null>, [unknown]>();
  const mockCompanyFindOne = jest.fn<Promise<Company | null>, [unknown]>();

  const userRepoMock = {
    findOne: mockUserFindOne,
    save: mockUserSave,
  };

  const etudiantRepoMock = {
    findOne: mockEtudiantFindOne,
    save: jest.fn(),
  };

  const companyRepoMock = {
    findOne: mockCompanyFindOne,
    save: jest.fn(),
  };

  const jwtServiceMock = { sign: jest.fn().mockReturnValue('signed-jwt') };
  const configServiceMock = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };
  const mailServiceMock = {
    sendPasswordResetMail: jest.fn().mockResolvedValue(undefined),
  };

  const buildRole = (nom: RolesEnum): Role =>
    ({
      id: 'role-1',
      nom,
    }) as Role;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-1',
      nom: 'Jean',
      prenom: 'Dupont',
      email: 'jean@example.com',
      password: 'hashed-password',
      resetPasswordToken: null,
      resetPasswordExpires: null,
      role: buildRole(RolesEnum.ETUDIANT),
      ...overrides,
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Etudiant), useValue: etudiantRepoMock },
        { provide: getRepositoryToken(Company), useValue: companyRepoMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
  });

  afterEach(() => jest.clearAllMocks());

  // ==========================================================================
  // login()
  // ==========================================================================
  describe('login', () => {
    it('retourne un token et les infos utilisateur pour un étudiant', async () => {
      const user = buildUser({ role: buildRole(RolesEnum.ETUDIANT) });
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockEtudiantFindOne.mockResolvedValue({ id: 'etudiant-1' } as Etudiant);

      const result = await service.login(user.email, 'password');

      expect(mockUserFindOne).toHaveBeenCalledWith({
        where: { email: user.email },
        relations: { role: true },
      });
      expect(result.access_token).toBe('signed-jwt');
      expect(result.user).toEqual({
        id: user.id,
        nom: user.nom,
        email: user.email,
        id_etudiant: 'etudiant-1',
      });
    });

    it('retourne un token et les infos utilisateur pour un RH', async () => {
      const user = buildUser({ role: buildRole(RolesEnum.RH) });
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockCompanyFindOne.mockResolvedValue({ id: 'company-1' } as Company);

      const result = await service.login(user.email, 'password');

      expect(result.user).toEqual({
        id: user.id,
        nom: user.nom,
        email: user.email,
        id_company: 'company-1',
      });
    });

    it('retourne un token sans ID spécifique pour un rôle sans entité associée', async () => {
      const user = buildUser({ role: buildRole(RolesEnum.ADMIN) });
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(user.email, 'password');

      expect(result.user).toEqual({
        id: user.id,
        nom: user.nom,
        email: user.email,
      });
    });

    it("retourne un objet vide si l'étudiant n'existe pas", async () => {
      const user = buildUser({ role: buildRole(RolesEnum.ETUDIANT) });
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockEtudiantFindOne.mockResolvedValue(null);

      const result = await service.login(user.email, 'password');

      expect(result.user).not.toHaveProperty('id_etudiant');
    });

    it("retourne un objet vide si la company n'existe pas", async () => {
      const user = buildUser({ role: buildRole(RolesEnum.RH) });
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockCompanyFindOne.mockResolvedValue(null);

      const result = await service.login(user.email, 'password');

      expect(result.user).not.toHaveProperty('id_company');
    });

    it("lance une exception si l'utilisateur n'existe pas", async () => {
      mockUserFindOne.mockResolvedValue(null);

      await expect(
        service.login('inconnu@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
      expect(jwtServiceMock.sign).not.toHaveBeenCalled();
    });

    it('lance une exception si le mot de passe est incorrect', async () => {
      const user = buildUser();
      mockUserFindOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(user.email, 'wrong-password')).rejects.toThrow(
        BadRequestException,
      );
      expect(jwtServiceMock.sign).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // forgotPassword()
  // ==========================================================================
  describe('forgotPassword', () => {
    it("ne fait rien (silencieusement) si l'email est inconnu", async () => {
      mockUserFindOne.mockResolvedValue(null);

      await service.forgotPassword('inconnu@example.com');

      expect(mockUserSave).not.toHaveBeenCalled();
      expect(mailServiceMock.sendPasswordResetMail).not.toHaveBeenCalled();
    });

    it('génère un token, le persiste hashé et envoie le mail', async () => {
      const user = buildUser();
      mockUserFindOne.mockResolvedValue(user);

      await service.forgotPassword(user.email);

      expect(mockUserSave).toHaveBeenCalledTimes(1);
      // ✅ Accès sécurisé avec optional chaining
      const savedUser = mockUserSave.mock.calls[0]?.[0];
      expect(savedUser).toBeDefined();
      expect(savedUser?.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
      expect(savedUser?.resetPasswordExpires).toBeInstanceOf(Date);

      expect(mailServiceMock.sendPasswordResetMail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('http://localhost:5173/reset-password?token='),
        user.nom,
      );
    });
  });

  // ==========================================================================
  // resetPassword()
  // ==========================================================================
  describe('resetPassword', () => {
    it('rejette un token qui ne correspond à aucun utilisateur', async () => {
      mockUserFindOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserSave).not.toHaveBeenCalled();
    });

    it('rejette un token expiré', async () => {
      const user = buildUser({
        resetPasswordToken: 'whatever-hash',
        resetPasswordExpires: new Date(Date.now() - 1000),
      });
      mockUserFindOne.mockResolvedValue(user);

      await expect(
        service.resetPassword('raw-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserSave).not.toHaveBeenCalled();
    });

    it('rejette si resetPasswordExpires est null', async () => {
      const user = buildUser({
        resetPasswordToken: 'whatever-hash',
        resetPasswordExpires: null,
      });
      mockUserFindOne.mockResolvedValue(user);

      await expect(
        service.resetPassword('raw-token', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserSave).not.toHaveBeenCalled();
    });

    it('met à jour le mot de passe et invalide le token quand tout est valide', async () => {
      const user = buildUser({
        resetPasswordToken: 'whatever-hash',
        resetPasswordExpires: new Date(Date.now() + 60_000),
      });
      mockUserFindOne.mockResolvedValue(user);

      await service.resetPassword('raw-token', 'NewPassword123!');

      expect(mockUserSave).toHaveBeenCalledTimes(1);
      const savedUser = mockUserSave.mock.calls[0]?.[0];
      expect(savedUser).toBeDefined();
      expect(savedUser?.resetPasswordToken).toBeNull();
      expect(savedUser?.resetPasswordExpires).toBeNull();
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(savedUser?.password).toBe('new-hashed-password');
    });
  });
});
