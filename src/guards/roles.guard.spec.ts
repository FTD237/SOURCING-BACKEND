import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Roles } from '../common/enum/roles.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: { role?: Roles }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devrait autoriser l'accès si aucun rôle n'est requis", () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    const context = createMockContext({ role: Roles.ETUDIANT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("devrait autoriser l'accès si le tableau de rôles requis est vide", () => {
    jest.spyOn(reflector, 'get').mockReturnValue([]);
    const context = createMockContext({ role: Roles.ETUDIANT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("devrait lever une exception si l'utilisateur n'est pas authentifié", () => {
    jest.spyOn(reflector, 'get').mockReturnValue([Roles.ADMIN]);
    jest.spyOn(ExceptionFactory, 'forbidden').mockImplementation(() => {
      throw new Error('Utilisateur non authentifié');
    });
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(
      'Utilisateur non authentifié',
    );
  });

  it("devrait lever une exception si l'utilisateur n'a pas de rôle défini", () => {
    jest.spyOn(reflector, 'get').mockReturnValue([Roles.ADMIN]);
    jest.spyOn(ExceptionFactory, 'forbidden').mockImplementation(() => {
      throw new Error('Utilisateur sans rôles définis');
    });
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(
      'Utilisateur sans rôles définis',
    );
  });

  it("devrait lever une exception si le rôle de l'utilisateur est insuffisant", () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue([Roles.ADMIN, Roles.SUPERADMIN]);
    jest.spyOn(ExceptionFactory, 'forbidden').mockImplementation(() => {
      throw new Error('Accès refusé : rôle insuffisant');
    });
    const context = createMockContext({ role: Roles.ETUDIANT });

    expect(() => guard.canActivate(context)).toThrow(
      'Accès refusé : rôle insuffisant',
    );
  });

  it("devrait autoriser l'accès si le rôle de l'utilisateur fait partie des rôles requis", () => {
    jest.spyOn(reflector, 'get').mockReturnValue([Roles.ADMIN, Roles.MANAGER]);
    const context = createMockContext({ role: Roles.MANAGER });

    expect(guard.canActivate(context)).toBe(true);
  });
});
