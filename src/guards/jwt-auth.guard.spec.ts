// src/guards/jwt-auth.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockRequest = {
    method: 'GET',
    url: '/skills',
  };

  const createMockContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  afterEach(() => jest.clearAllMocks());

  describe('handleRequest', () => {
    it('retourne user quand la validation réussit', () => {
      const user = { id: 'user-1', email: 'test@test.com', role: 'rh' };
      const context = createMockContext();

      const result = guard.handleRequest(null, user, undefined, context);

      expect(result).toEqual(user);
    });

    it('lève UnauthorizedException avec le message de info quand user est false', () => {
      const context = createMockContext();
      const info = { message: 'No auth token' };

      expect(() => guard.handleRequest(null, false, info, context)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, false, info, context)).toThrow(
        'No auth token',
      );
    });

    it("lève UnauthorizedException avec un message par défaut si info n'a pas de message", () => {
      const context = createMockContext();

      expect(() =>
        guard.handleRequest(null, false, undefined, context),
      ).toThrow('Unauthorized');
    });

    it("relance l'erreur originale si err est fourni", () => {
      const context = createMockContext();
      const originalError = new Error('Token malformé');

      expect(() =>
        guard.handleRequest(originalError, false, undefined, context),
      ).toThrow(originalError);
    });

    it('relance err même si user est présent (err prioritaire)', () => {
      const context = createMockContext();
      const originalError = new Error('Erreur inattendue');
      const user = { id: 'user-1', email: 'test@test.com' };

      expect(() =>
        guard.handleRequest(originalError, user, undefined, context),
      ).toThrow(originalError);
    });

    it('logue les détails de la requête (method, url, err, user, info)', () => {
      const context = createMockContext();
      const logSpy = jest.spyOn(
        (guard as unknown as { logger: { debug: jest.Mock } }).logger,
        'debug',
      );
      const user = { id: 'user-1', email: 'test@test.com' };

      guard.handleRequest(null, user, undefined, context);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /skills'),
      );
    });
  });
});
