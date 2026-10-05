// evaluation/evaluation.controller.spec.ts
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PaginationDto } from '../common/pagination';

const USER = { id: 'user-1', companyId: 'company-1' };

describe('EvaluationController', () => {
  let controller: EvaluationController;
  let service: {
    create: jest.Mock;
    findByStudent: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findByStudent: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [EvaluationController],
      providers: [{ provide: EvaluationService, useValue: service }],
    })
      // Les guards sont testés séparément : on les neutralise ici
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(EvaluationController);
  });

  describe('create', () => {
    it("délègue au service avec l'entreprise de l'utilisateur", async () => {
      const dto = { experience_id: 'exp-1', note: 5, commentaire: 'Top' };
      const created = { id: 'eval-1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto, USER);

      expect(service.create).toHaveBeenCalledWith(USER.companyId, dto, USER);
      expect(result).toBe(created);
    });

    it("propage l'erreur du service", async () => {
      const error = new Error('Conflit');
      service.create.mockRejectedValue(error);

      await expect(
        controller.create({ experience_id: 'exp-1', note: 5 }, USER),
      ).rejects.toBe(error);
    });
  });

  describe('findByStudent', () => {
    it('délègue au service avec la pagination', async () => {
      const pagination = { page: 1, limite: 10 } as PaginationDto;
      const page = { donnees: [], meta: { page: 1, limite: 10, total: 0 } };
      service.findByStudent.mockResolvedValue(page);

      const result = await controller.findByStudent('student-1', pagination);

      expect(service.findByStudent).toHaveBeenCalledWith(
        'student-1',
        pagination,
      );
      expect(result).toBe(page);
    });
  });

  describe('update', () => {
    it("délègue au service avec l'id, le dto et l'utilisateur", async () => {
      const dto = { note: 4 };
      const updated = { id: 'eval-1', note: 4 };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('eval-1', dto, USER);

      expect(service.update).toHaveBeenCalledWith(
        USER.companyId,
        'eval-1',
        dto,
        USER,
      );
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it("délègue au service avec l'entreprise et l'utilisateur", async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('eval-1', USER);

      expect(service.remove).toHaveBeenCalledWith(
        USER.companyId,
        'eval-1',
        USER,
      );
    });

    it('répond en 204 No Content', () => {
      const code = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        EvaluationController.prototype.remove,
      ) as number;

      expect(code).toBe(HttpStatus.NO_CONTENT);
    });
  });
});
