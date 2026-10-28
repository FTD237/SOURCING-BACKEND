// src/notifications/notification.controller.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../common/enum/notification-type.enum';
import { ResultatPagine } from '../common/pagination';
import { buildPagination } from '../../test/support/pagination.helper';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: jest.Mocked<NotificationService>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockNotification: Notification = {
    id: 'notif-1',
    userId: currentUser.id,
    type: NotificationType.CANDIDATURE_RECUE,
    titre: 'Nouvelle candidature',
    message: 'Un étudiant a postulé.',
    lu: false,
  } as Notification;

  const mockPaginated: ResultatPagine<Notification> = {
    donnees: [mockNotification],
    meta: {
      page: 1,
      limite: 10,
      total: 1,
      totalPages: 1,
      aSuivante: false,
      aPrecedente: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            findAllForUser: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            getPreferencesForUser: jest.fn(),
            updatePreference: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get(NotificationService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll() délègue au service avec la pagination et l’utilisateur courant', async () => {
    const pagination = buildPagination({ page: 1, limite: 10, ordre: 'DESC' });
    service.findAllForUser.mockResolvedValue(mockPaginated);

    const result = await controller.findAll(pagination, currentUser);

    expect(service.findAllForUser).toHaveBeenCalledWith(
      currentUser.id,
      pagination,
    );
    expect(result).toEqual(mockPaginated);
  });

  it('markAsRead() transmet id et userId', async () => {
    service.markAsRead.mockResolvedValue({ ...mockNotification, lu: true });

    const result = await controller.markAsRead('notif-1', currentUser);

    expect(service.markAsRead).toHaveBeenCalledWith('notif-1', currentUser.id);
    expect(result.lu).toBe(true);
  });

  it('markAllAsRead() transmet userId', async () => {
    service.markAllAsRead.mockResolvedValue(undefined);

    await controller.markAllAsRead(currentUser);

    expect(service.markAllAsRead).toHaveBeenCalledWith(currentUser.id);
  });

  it('getPreferences() retourne les préférences de l’utilisateur courant', async () => {
    const prefs = {
      [NotificationType.NOUVELLE_OFFRE]: true,
      [NotificationType.CANDIDATURE_RECUE]: false,
      [NotificationType.CANDIDATURE_ACCEPTEE]: true,
      [NotificationType.CANDIDATURE_REFUSEE]: true,
      [NotificationType.RAPPEL]: true,
    };
    service.getPreferencesForUser.mockResolvedValue(prefs);

    const result = await controller.getPreferences(currentUser);

    expect(service.getPreferencesForUser).toHaveBeenCalledWith(currentUser.id);
    expect(result).toEqual(prefs);
  });

  it('updatePreferences() transmet userId et dto', async () => {
    const dto = {
      preferences: [{ type: NotificationType.RAPPEL, active: false }],
    };
    service.updatePreference.mockResolvedValue(undefined);

    await controller.updatePreferences(dto, currentUser);

    expect(service.updatePreference).toHaveBeenCalledWith(currentUser.id, dto);
  });
});
