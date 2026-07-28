import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { ActivationTokenService } from './activation-token.service';
import { ActivationToken } from '../../entity/activation-token.entity';
import { ExceptionFactory } from '../exceptions/exception-factory';


jest.mock('../exceptions/exception-factory', () => ({
  ExceptionFactory: {
    notFound: jest.fn(() => {
      throw new Error('NotFound');
    }),
    businessConflict: jest.fn(() => {
      throw new Error('BusinessConflict');
    }),
  },
}));

interface MockRepo {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
}

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

describe('ActivationTokenService', () => {
  let service: ActivationTokenService;
  let dataSource: { getRepository: jest.Mock };
  let repo: MockRepo;

  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, FRONTEND_URL: 'https://example.com' };

    repo = createMockRepo();

    dataSource = {
      getRepository: jest.fn().mockReturnValue(repo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationTokenService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ActivationTokenService>(ActivationTokenService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('generate', () => {
    it('génère un rawToken hexadécimal de 64 caractères (32 bytes)', () => {
      const result = service.generate();
      expect(result.rawToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('génère un tokenHash correspondant au sha256 du rawToken', () => {
      const result = service.generate();
      const expectedHash = crypto
        .createHash('sha256')
        .update(result.rawToken)
        .digest('hex');
      expect(result.tokenHash).toBe(expectedHash);
    });

    it('génère deux tokens différents à chaque appel', () => {
      const first = service.generate();
      const second = service.generate();
      expect(first.rawToken).not.toBe(second.rawToken);
      expect(first.tokenHash).not.toBe(second.tokenHash);
    });

    it('définit expiresAt à 24h dans le futur par défaut', () => {
      const before = Date.now();
      const result = service.generate();
      const after = Date.now();

      const expectedMin = before + 24 * 60 * 60 * 1000;
      const expectedMax = after + 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('respecte le paramètre validityHours personnalisé', () => {
      const before = Date.now();
      const result = service.generate(1);
      const after = Date.now();

      const expectedMin = before + 60 * 60 * 1000;
      const expectedMax = after + 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('createAndSave', () => {
    it('utilise le repository du dataSource par défaut quand aucun manager n’est fourni', async () => {
      const savedEntity: ActivationToken = {
        id: 'token-id',
      } as ActivationToken;
      repo.create.mockReturnValue(savedEntity);
      repo.save.mockResolvedValue(savedEntity);

      const rawToken = await service.createAndSave('user-1');

      expect(dataSource.getRepository).toHaveBeenCalledWith(ActivationToken);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(repo.save).toHaveBeenCalledWith(savedEntity);
      expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('utilise le repository fourni par l’EntityManager quand il est présent (transaction)', async () => {
      const savedEntity: ActivationToken = {
        id: 'token-id',
      } as ActivationToken;
      const managerRepo: MockRepo = createMockRepo();
      managerRepo.create.mockReturnValue(savedEntity);
      managerRepo.save.mockResolvedValue(savedEntity);
      const getRepositoryMock = jest.fn().mockReturnValue(managerRepo);
      const manager = {
        getRepository: getRepositoryMock,
      } as unknown as EntityManager;

      await service.createAndSave('user-2', manager);

      expect(getRepositoryMock).toHaveBeenCalledWith(ActivationToken);
      expect(dataSource.getRepository).not.toHaveBeenCalled();
      expect(managerRepo.save).toHaveBeenCalledWith(savedEntity);
    });

    it('persiste avec le tokenHash et non le rawToken (sécurité)', async () => {
      repo.create.mockImplementation(
        (data: Partial<ActivationToken>): Partial<ActivationToken> => data,
      );
      repo.save.mockImplementation(
        (data: Partial<ActivationToken>): Promise<Partial<ActivationToken>> =>
          Promise.resolve(data),
      );

      const rawToken = await service.createAndSave('user-3');
      const persistedArg = repo.create.mock
        .calls[0][0] as Partial<ActivationToken>;

      expect(persistedArg.tokenHash).toBeDefined();
      expect(persistedArg.tokenHash).not.toBe(rawToken);
      expect(persistedArg.userId).toBe('user-3');
    });

    it('applique validityHours personnalisé lors de la création', async () => {
      repo.create.mockImplementation(
        (data: Partial<ActivationToken>): Partial<ActivationToken> => data,
      );
      repo.save.mockImplementation(
        (data: Partial<ActivationToken>): Promise<Partial<ActivationToken>> =>
          Promise.resolve(data),
      );

      const before = Date.now();
      await service.createAndSave('user-4', undefined, 2);
      const persistedArg = repo.create.mock
        .calls[0][0] as Partial<ActivationToken>;

      const expectedMin = before + 2 * 60 * 60 * 1000;
      expect(persistedArg.expiresAt?.getTime()).toBeGreaterThanOrEqual(
        expectedMin - 1000,
      );
    });
  });

  describe('consume', () => {
    it('retourne le userId et marque le token comme utilisé si valide', async () => {
      const rawToken = 'raw-token-value';
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);

      const found: ActivationToken = {
        id: 'activation-id',
        userId: 'user-42',
        tokenHash,
        expiresAt: futureDate,
        used: false,
      } as ActivationToken;

      repo.findOne.mockResolvedValue(found);
      repo.update.mockResolvedValue({ affected: 1 });

      const userId = await service.consume(rawToken);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { tokenHash, used: false },
      });
      expect(repo.update).toHaveBeenCalledWith('activation-id', {
        used: true,
      });
      expect(userId).toBe('user-42');
    });

    it("lève une exception 'notFound' si le token n'existe pas ou est déjà utilisé", async () => {
      repo.findOne.mockResolvedValue(null);
      const notFoundMock = jest.mocked(ExceptionFactory.notFound);

      await expect(service.consume('unknown-token')).rejects.toThrow(
        'NotFound',
      );
      expect(notFoundMock).toHaveBeenCalledWith(
        "Lien d'activation invalide ou déjà utilisé",
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("lève une exception 'businessConflict' si le token est expiré", async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const found: ActivationToken = {
        id: 'activation-id',
        userId: 'user-42',
        tokenHash: 'hash',
        expiresAt: pastDate,
        used: false,
      } as ActivationToken;

      repo.findOne.mockResolvedValue(found);
      const businessConflictMock = jest.mocked(
        ExceptionFactory.businessConflict,
      );

      await expect(service.consume('expired-token')).rejects.toThrow(
        'BusinessConflict',
      );
      expect(businessConflictMock).toHaveBeenCalledWith(
        'ActivationToken',
        'Ce lien a expiré, veuillez en demander un nouveau',
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('utilise le repository fourni par l’EntityManager quand il est présent', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const found: ActivationToken = {
        id: 'activation-id',
        userId: 'user-99',
        tokenHash: 'hash',
        expiresAt: futureDate,
        used: false,
      } as ActivationToken;

      const managerRepo: MockRepo = createMockRepo();
      managerRepo.findOne.mockResolvedValue(found);
      managerRepo.update.mockResolvedValue({ affected: 1 });
      const getRepositoryMock = jest.fn().mockReturnValue(managerRepo);
      const manager = {
        getRepository: getRepositoryMock,
      } as unknown as EntityManager;

      const userId = await service.consume('some-token', manager);

      expect(getRepositoryMock).toHaveBeenCalledWith(ActivationToken);
      expect(dataSource.getRepository).not.toHaveBeenCalled();
      expect(userId).toBe('user-99');
    });

    it('calcule le hash du rawToken reçu avant de chercher en base (ne cherche jamais le rawToken en clair)', async () => {
      const rawToken = 'plain-raw-token';
      repo.findOne.mockResolvedValue(null);

      await expect(service.consume(rawToken)).rejects.toThrow();

      const expectedHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { tokenHash: expectedHash, used: false },
      });
    });
  });

  describe('buildActivationLink', () => {
    it("construit l'URL d'activation avec FRONTEND_URL et le token", () => {
      const link = service.buildActivationLink('abc123');
      expect(link).toBe('https://example.com/activation?token=abc123');
    });

    it("reflète les changements de FRONTEND_URL dans l'environnement", () => {
      process.env.FRONTEND_URL = 'https://staging.example.com';
      const link = service.buildActivationLink('xyz789');
      expect(link).toBe('https://staging.example.com/activation?token=xyz789');
    });
  });
});
