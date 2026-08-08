// test/unit/common/services/account-creation.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountCreationService } from './account-creation.service';
import { User } from '../../user/user.entity';
import { Role } from '../../entity/role.entity';
import { Statut } from '../enum/statut.enum';
import { Roles } from '../enum/roles.enum';
import { ExceptionFactory } from '../exceptions/exception-factory';
import { ActivationTokenService } from './activation-token.service';
import { MailService } from '../../mail/mail.service';
import { DataSource } from 'typeorm';
import * as generatePasswordModule from '../utils/generate-password';

jest.mock('bcrypt');

interface MockUserRepository {
  findOne: jest.Mock;
}

interface MockRoleRepository {
  findOne: jest.Mock;
}

interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
}

interface MockQueryRunner {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: MockEntityManager;
}

interface MockDataSource {
  createQueryRunner: jest.Mock;
}

interface MockActivationTokenService {
  createAndSave: jest.Mock;
  buildActivationLink: jest.Mock;
}

interface MockMailService {
  sendAccountActivationMail: jest.Mock;
}

describe('AccountCreationService', () => {
  let service: AccountCreationService;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;
  let dataSource: MockDataSource;
  let queryRunner: MockQueryRunner;
  let activationTokenService: MockActivationTokenService;
  let mailService: MockMailService;
  let loggerErrorSpy: jest.SpyInstance;

  const mockRawToken = 'raw-activation-token';
  const mockActivationLink =
    'https://app.example.com/activate?token=raw-activation-token';

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'jean@techcorp.com',
    nom: 'Tech Corp',
    prenom: 'Jean',
    statut: Statut.EN_ATTENTE_ACTIVATION,
  };

  const mockRole: Partial<Role> = {
    id: 'role-1',
    nom: Roles.RH,
  };

  const mockParams = {
    email: 'Jean@TechCorp.com',
    nom: 'Tech Corp',
    prenom: 'Jean',
    roleId: 'role-1',
    createdBy: 'admin-1',
    contextEntity: 'Company',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    roleRepository = {
      findOne: jest.fn().mockResolvedValue(mockRole),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest
          .fn()
          .mockImplementation((_entity: unknown, data: unknown) => data),
        save: jest.fn().mockResolvedValue(mockUser),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    activationTokenService = {
      createAndSave: jest.fn().mockResolvedValue(mockRawToken),
      buildActivationLink: jest.fn().mockReturnValue(mockActivationLink),
    };

    mailService = {
      sendAccountActivationMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountCreationService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        { provide: DataSource, useValue: dataSource },
        {
          provide: ActivationTokenService,
          useValue: activationTokenService,
        },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AccountCreationService>(AccountCreationService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  // -------------------------------------------------------------------------
  // checkEmailAvailable()
  // -------------------------------------------------------------------------
  describe('checkEmailAvailable', () => {
    it('should resolve silently when no user has this email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkEmailAvailable('jean@techcorp.com', 'Company'),
      ).resolves.toBeUndefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'jean@techcorp.com' },
      });
    });

    it('should normalize the email before checking (lowercase + trim)', async () => {
      await service.checkEmailAvailable('  Jean@TechCorp.com  ', 'Company');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'jean@techcorp.com' },
      });
    });

    it('should throw a business conflict when the email is already taken', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      const businessConflictSpy = jest
        .spyOn(ExceptionFactory, 'businessConflict')
        .mockImplementation(() => {
          throw new Error(
            "Un utilisateur avec l'email jean@techcorp.com existe déjà",
          );
        });

      await expect(
        service.checkEmailAvailable('jean@techcorp.com', 'Company'),
      ).rejects.toThrow(
        "Un utilisateur avec l'email jean@techcorp.com existe déjà",
      );
      expect(businessConflictSpy).toHaveBeenCalledWith(
        'Company',
        "Un utilisateur avec l'email jean@techcorp.com existe déjà",
      );
    });
  });

  // -------------------------------------------------------------------------
  // findRoleOrFail()
  // -------------------------------------------------------------------------
  describe('findRoleOrFail', () => {
    it('should return the role when it exists', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findRoleOrFail(Roles.RH, 'not used');

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { nom: Roles.RH },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw not found when the role does not exist', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      const notFoundSpy = jest
        .spyOn(ExceptionFactory, 'notFound')
        .mockImplementation(() => {
          throw new Error('Le rôle "rh" n\'existe pas');
        });

      await expect(
        service.findRoleOrFail(Roles.RH, 'Le rôle "rh" n\'existe pas'),
      ).rejects.toThrow('Le rôle "rh" n\'existe pas');
      expect(notFoundSpy).toHaveBeenCalledWith('Le rôle "rh" n\'existe pas');
    });
  });

  // -------------------------------------------------------------------------
  // createUserWithActivation()
  // -------------------------------------------------------------------------
  describe('createUserWithActivation', () => {
    it('should create the user and the business entity within one transaction', async () => {
      const mockEntity = { id: 'company-1' };
      const createBusinessEntity = jest.fn().mockResolvedValue(mockEntity);

      const result = await service.createUserWithActivation(
        mockParams,
        createBusinessEntity,
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          email: 'jean@techcorp.com',
          nom: mockParams.nom,
          prenom: mockParams.prenom,
          id_role: mockParams.roleId,
          statut: Statut.EN_ATTENTE_ACTIVATION,
          create_by: mockParams.createdBy,
        }),
      );
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(createBusinessEntity).toHaveBeenCalledWith(
        queryRunner.manager,
        mockUser,
      );
      expect(activationTokenService.createAndSave).toHaveBeenCalledWith(
        mockUser.id,
        queryRunner.manager,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        entity: mockEntity,
        rawToken: mockRawToken,
      });
    });

    it('should send the activation email after the transaction commits', async () => {
      const createBusinessEntity = jest
        .fn()
        .mockResolvedValue({ id: 'company-1' });

      await service.createUserWithActivation(mockParams, createBusinessEntity);

      expect(activationTokenService.buildActivationLink).toHaveBeenCalledWith(
        mockRawToken,
      );
      expect(mailService.sendAccountActivationMail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.nom,
        mockActivationLink,
      );
    });

    it('should not block creation when sending the activation email fails', async () => {
      const createBusinessEntity = jest
        .fn()
        .mockResolvedValue({ id: 'company-1' });
      mailService.sendAccountActivationMail.mockRejectedValue(
        new Error('SMTP unreachable'),
      );

      const result = await service.createUserWithActivation(
        mockParams,
        createBusinessEntity,
      );

      expect(result.user).toEqual(mockUser);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockUser.email as string),
        expect.any(Error),
      );
    });

    it('should rollback and rethrow when creating the business entity fails', async () => {
      const businessError = new Error('duplicate key value');
      const createBusinessEntity = jest.fn().mockRejectedValue(businessError);
      const databaseSpy = jest
        .spyOn(ExceptionFactory, 'database')
        .mockImplementation(() => {
          throw new Error('Database error while creating Company');
        });

      await expect(
        service.createUserWithActivation(mockParams, createBusinessEntity),
      ).rejects.toThrow('Database error while creating Company');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(databaseSpy).toHaveBeenCalledWith(
        businessError,
        mockParams.contextEntity,
      );
      expect(mailService.sendAccountActivationMail).not.toHaveBeenCalled();
    });

    it('should rollback and rethrow when saving the activation token fails', async () => {
      const tokenError = new Error('token save failed');
      activationTokenService.createAndSave.mockRejectedValue(tokenError);
      jest.spyOn(ExceptionFactory, 'database').mockImplementation(() => {
        throw new Error('Database error while creating Company');
      });
      const createBusinessEntity = jest
        .fn()
        .mockResolvedValue({ id: 'company-1' });

      await expect(
        service.createUserWithActivation(mockParams, createBusinessEntity),
      ).rejects.toThrow('Database error while creating Company');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mailService.sendAccountActivationMail).not.toHaveBeenCalled();
    });

    it('should always release the query runner, even on failure', async () => {
      const createBusinessEntity = jest
        .fn()
        .mockRejectedValue(new Error('boom'));
      jest.spyOn(ExceptionFactory, 'database').mockImplementation(() => {
        throw new Error('Database error while creating Company');
      });

      await expect(
        service.createUserWithActivation(mockParams, createBusinessEntity),
      ).rejects.toThrow();

      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should use a freshly generated password for hashing', async () => {
      const generatePasswordSpy = jest
        .spyOn(generatePasswordModule, 'generatePassword')
        .mockReturnValue('SpecificGeneratedPass1!');
      const createBusinessEntity = jest
        .fn()
        .mockResolvedValue({ id: 'company-1' });

      await service.createUserWithActivation(mockParams, createBusinessEntity);

      expect(generatePasswordSpy).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('SpecificGeneratedPass1!', 10);

      generatePasswordSpy.mockRestore();
    });
  });
});
