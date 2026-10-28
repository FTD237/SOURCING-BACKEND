// test/unit/auth/jwt.strategy.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt-strategy';
import { User } from '../user/user.entity';
import { Statut } from '../common/enum/statut.enum';

interface MockUserRepository {
  findOne: jest.Mock;
}

interface MockConfigService {
  get: jest.Mock;
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: MockUserRepository;
  let configService: MockConfigService;

  const mockPayload = {
    id: 'user-1',
    email: 'jean@techcorp.com',
    role: 'rh',
    iat: 1000,
    exp: 2000,
  };

  const mockActiveUser: Partial<User> = {
    id: 'user-1',
    email: 'jean@techcorp.com',
    statut: Statut.ACTIF,
  };

  const createModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: configService },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn().mockResolvedValue(mockActiveUser),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module = await createModule();
    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  // -------------------------------------------------------------------------
  // constructor
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('should throw when JWT_SECRET is not defined', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(createModule()).rejects.toThrow(
        'JWT_SECRET is not defined in environment variables',
      );
    });
  });

  // -------------------------------------------------------------------------
  // validate()
  // -------------------------------------------------------------------------
  describe('validate', () => {
    it('should return the authenticated user on success', async () => {
      const result = await strategy.validate(mockPayload);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.id },
      });
      expect(result).toEqual({
        id: mockActiveUser.id,
        email: mockActiveUser.email,
        role: mockPayload.role,
      });
    });

    it('should not leak iat/exp into the returned user object', async () => {
      const result = await strategy.validate(mockPayload);

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Utilisateur introuvable',
      );
    });

    it.each([Statut.EN_ATTENTE_ACTIVATION, Statut.SUPPRIME])(
      'should throw UnauthorizedException when the user statut is %s',
      async (statut) => {
        userRepository.findOne.mockResolvedValue({
          ...mockActiveUser,
          statut,
        });

        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          'Compte utilisateur inactif',
        );
      },
    );
  });
});
