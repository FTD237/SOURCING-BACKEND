// jobseeker/jobseeker.controller.spec.ts
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { JobseekerController } from './jobseeker.controller';
import { JobseekerService } from './jobseeker.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PaginationDto } from '../common/pagination';

const USER = { id: 'user-1', etudiantId: 'student-1' };

describe('JobseekerController', () => {
  let controller: JobseekerController;
  let service: {
    activer: jest.Mock;
    desactiver: jest.Mock;
    findByStudent: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      activer: jest.fn(),
      desactiver: jest.fn(),
      findByStudent: jest.fn(),
      findAll: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [JobseekerController],
      providers: [{ provide: JobseekerService, useValue: service }],
    })
      // Les guards sont testés séparément : on les neutralise ici
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(JobseekerController);
  });

  describe('findAll', () => {
    it('délègue au service avec la pagination', async () => {
      const pagination = { page: 1, limite: 10 } as PaginationDto;
      const page = { donnees: [], meta: { page: 1, limite: 10, total: 0 } };
      service.findAll.mockResolvedValue(page);

      const result = await controller.findAll(pagination);

      expect(service.findAll).toHaveBeenCalledWith(pagination);
      expect(result).toBe(page);
    });
  });

  describe('findMine', () => {
    it("utilise l'étudiant de l'utilisateur connecté", async () => {
      const jobseeker = { id: 'js-1', studentId: USER.etudiantId };
      service.findByStudent.mockResolvedValue(jobseeker);

      const result = await controller.findMine(USER);

      expect(service.findByStudent).toHaveBeenCalledWith(USER.etudiantId);
      expect(result).toBe(jobseeker);
    });

    it("propage l'erreur du service", async () => {
      const error = new Error('Introuvable');
      service.findByStudent.mockRejectedValue(error);

      await expect(controller.findMine(USER)).rejects.toBe(error);
    });
  });

  describe('activate', () => {
    it("active la recherche d'emploi de l'étudiant connecté", async () => {
      const dto = { entreprise: 'MTN Cam', poste: 'DSI', is_jobless: false };
      const jobseeker = { id: 'js-1', ...dto };
      service.activer.mockResolvedValue(jobseeker);

      const result = await controller.activate(dto, USER);

      expect(service.activer).toHaveBeenCalledWith(USER.etudiantId, dto, USER);
      expect(result).toBe(jobseeker);
    });

    it('accepte un corps vide', async () => {
      service.activer.mockResolvedValue({ id: 'js-1' });

      await controller.activate({}, USER);

      expect(service.activer).toHaveBeenCalledWith(USER.etudiantId, {}, USER);
    });
  });

  describe('deactivate', () => {
    it("désactive la recherche d'emploi de l'étudiant connecté", async () => {
      service.desactiver.mockResolvedValue(undefined);

      await controller.deactivate(USER);

      expect(service.desactiver).toHaveBeenCalledWith(USER.etudiantId, USER);
    });

    it('répond en 204 No Content', () => {
      const code = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        JobseekerController.prototype.deactivate,
      ) as number;

      expect(code).toBe(HttpStatus.NO_CONTENT);
    });
  });
});
