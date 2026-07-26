import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('forgotPassword', () => {
    it('délègue au service et renvoie un message générique', async () => {
      authServiceMock.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword({
        email: 'jean@example.com',
      });

      expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(
        'jean@example.com',
      );
      expect(typeof result.message).toBe('string');
    });
  });

  describe('resetPassword', () => {
    it('délègue au service avec le token et le nouveau mot de passe', async () => {
      authServiceMock.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword({
        token: 'abc',
        newPassword: 'NewPassword123!',
      });

      expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
        'abc',
        'NewPassword123!',
      );
      expect(typeof result.message).toBe('string');
    });
  });
});
