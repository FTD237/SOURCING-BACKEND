// test/unit/support/create-controller-testing-module.ts

import { Test, TestingModule } from '@nestjs/testing';
import { Provider, Type } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';

/**
 * Crée un TestingModule pour un contrôleur, avec JwtAuthGuard et RolesGuard
 * automatiquement overridés pour laisser passer toutes les requêtes.
 *
 * Usage:
 *   const module = await createControllerTestingModule(EtudiantController, [
 *     { provide: EtudiantService, useValue: mockService },
 *   ]);
 */
export async function createControllerTestingModule(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<TestingModule> {
  return Test.createTestingModule({
    controllers: [controller],
    providers,
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();
}
