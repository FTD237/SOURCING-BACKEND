// src/notifications/notification.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationType } from '../common/enum/notification-type.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { buildPagination } from '../../test/support/pagination.helper';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo: jest.Mocked<Repository<Notification>>;
  let preferenceRepo: jest.Mocked<Repository<NotificationPreference>>;

  const userId = 'user-1';

  const mockNotification: Notification = {
    id: 'notif-1',
    userId,
    type: NotificationType.CANDIDATURE_RECUE,
    titre: 'Nouvelle candidature',
    message: 'Un étudiant a postulé.',
    data: null,
    lu: false,
    dateLecture: null,
  } as Notification;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepo = module.get(getRepositoryToken(Notification));
    preferenceRepo = module.get(getRepositoryToken(NotificationPreference));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const input = {
      userId,
      type: NotificationType.CANDIDATURE_RECUE,
      titre: 'Nouvelle candidature',
      message: 'Un étudiant a postulé.',
    };

    it("crée la notification quand le type est actif pour l'utilisateur", async () => {
      preferenceRepo.findOne.mockResolvedValue({
        active: true,
      } as NotificationPreference);
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      const result = await service.create(input);

      expect(preferenceRepo.findOne).toHaveBeenCalledWith({
        where: { userId, type: input.type },
      });
      expect(notificationRepo.create).toHaveBeenCalledWith({
        userId: input.userId,
        type: input.type,
        titre: input.titre,
        message: input.message,
        data: null,
      });
      expect(notificationRepo.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });

    it("crée la notification par défaut quand aucune préférence n'est configurée", async () => {
      preferenceRepo.findOne.mockResolvedValue(null);
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      const result = await service.create(input);

      expect(notificationRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it("ne crée rien quand le type est désactivé pour l'utilisateur", async () => {
      preferenceRepo.findOne.mockResolvedValue({
        active: false,
      } as NotificationPreference);

      const result = await service.create(input);

      expect(notificationRepo.create).not.toHaveBeenCalled();
      expect(notificationRepo.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('inclut data quand fourni', async () => {
      preferenceRepo.findOne.mockResolvedValue({
        active: true,
      } as NotificationPreference);
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      await service.create({ ...input, data: { offreId: 'offre-1' } });

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { offreId: 'offre-1' } }),
      );
    });
  });

  describe('findAllForUser', () => {
    it('retourne les notifications paginées', async () => {
      const pagination = buildPagination({ page: 1, limite: 10 });
      notificationRepo.findAndCount.mockResolvedValue([[mockNotification], 1]);

      const result = await service.findAllForUser(userId, pagination);

      expect(notificationRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { dte_creation: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.donnees).toEqual([mockNotification]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('calcule correctement le skip pour la page 2', async () => {
      const pagination = buildPagination({ page: 2, limite: 5 });
      notificationRepo.findAndCount.mockResolvedValue([[], 12]);

      await service.findAllForUser(userId, pagination);

      expect(notificationRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marque une notification comme lue', async () => {
      notificationRepo.findOne.mockResolvedValue({ ...mockNotification });
      notificationRepo.save.mockImplementation((n) =>
        Promise.resolve(n as Notification),
      );

      const result = await service.markAsRead('notif-1', userId);

      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId },
      });
      expect(result.lu).toBe(true);
      expect(result.dateLecture).toBeInstanceOf(Date);
    });

    it('lève une 404 si la notification est introuvable', async () => {
      notificationRepo.findOne.mockResolvedValue(null);
      const notFoundSpy = jest
        .spyOn(ExceptionFactory, 'notFound')
        .mockImplementation(() => {
          throw new Error('not found');
        });

      await expect(service.markAsRead('notif-1', userId)).rejects.toThrow(
        'not found',
      );
      expect(notFoundSpy).toHaveBeenCalledWith(
        'Notification #notif-1 not found',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('met à jour toutes les notifications non lues', async () => {
      await service.markAllAsRead(userId);

      expect(notificationRepo.update).toHaveBeenCalledWith(
        { userId, lu: false },
        expect.objectContaining({
          lu: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          dateLecture: expect.any(Date),
        }),
      );
    });
  });

  describe('getPreferencesForUser', () => {
    it('retourne les préférences enregistrées, actif par défaut pour le reste', async () => {
      preferenceRepo.find.mockResolvedValue([
        {
          type: NotificationType.CANDIDATURE_RECUE,
          active: false,
        } as NotificationPreference,
      ]);

      const result = await service.getPreferencesForUser(userId);

      expect(result[NotificationType.CANDIDATURE_RECUE]).toBe(false);
      expect(result[NotificationType.NOUVELLE_OFFRE]).toBe(true);
    });

    it("retourne tout actif par défaut si aucune préférence n'existe", async () => {
      preferenceRepo.find.mockResolvedValue([]);

      const result = await service.getPreferencesForUser(userId);

      Object.values(NotificationType).forEach((type) => {
        expect(result[type]).toBe(true);
      });
    });
  });

  describe('updatePreferences', () => {
    it('met à jour une préférence existante', async () => {
      const existing = {
        userId,
        type: NotificationType.CANDIDATURE_RECUE,
        active: true,
      } as NotificationPreference;
      preferenceRepo.findOne.mockResolvedValue(existing);
      preferenceRepo.save.mockResolvedValue(existing);

      await service.updatePreference(userId, {
        preferences: [
          { type: NotificationType.CANDIDATURE_RECUE, active: false },
        ],
      });

      expect(preferenceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });

    it("crée une nouvelle préférence si elle n'existe pas encore", async () => {
      preferenceRepo.findOne.mockResolvedValue(null);
      const created = {
        userId,
        type: NotificationType.RAPPEL,
        active: false,
      } as NotificationPreference;
      preferenceRepo.create.mockReturnValue(created);
      preferenceRepo.save.mockResolvedValue(created);

      await service.updatePreference(userId, {
        preferences: [{ type: NotificationType.RAPPEL, active: false }],
      });

      expect(preferenceRepo.create).toHaveBeenCalledWith({
        userId,
        type: NotificationType.RAPPEL,
        active: false,
      });
      expect(preferenceRepo.save).toHaveBeenCalledWith(created);
    });

    it('traite plusieurs préférences en une seule fois', async () => {
      preferenceRepo.findOne.mockResolvedValue(null);
      preferenceRepo.create.mockImplementation(
        (data) => data as NotificationPreference,
      );
      preferenceRepo.save.mockImplementation((p) =>
        Promise.resolve(p as NotificationPreference),
      );

      await service.updatePreference(userId, {
        preferences: [
          { type: NotificationType.RAPPEL, active: false },
          { type: NotificationType.NOUVELLE_OFFRE, active: true },
        ],
      });

      expect(preferenceRepo.save).toHaveBeenCalledTimes(2);
    });
  });
});
