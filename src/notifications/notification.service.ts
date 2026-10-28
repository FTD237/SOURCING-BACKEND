import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationType } from '../common/enum/notification-type.enum';
import {
  CreateNotificationInput,
  UpdatePreferencesDto,
} from './notification.dto';
import { PaginationDto, paginer, ResultatPagine } from '../common/pagination';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  /**
   * Point d'entrée utilisé par les AUTRES services (OffreService, AuthService, ...)
   * pour déclencher une notification. Respecte automatiquement les préférences
   * de l'utilisateur : si désactivé pour ce type, la notification n'est pas créée.
   */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const isEnabled = await this.isTypeEnabledForUser(input.userId, input.type);
    if (!isEnabled) return null;

    const notification = this.notificationRepository.create({
      userId: input.userId,
      type: input.type,
      titre: input.titre,
      message: input.message,
      data: input.data ?? null,
    });
    return this.notificationRepository.save(notification);
  }

  async findAllForUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<ResultatPagine<Notification>> {
    const { page, limite } = pagination;
    const result = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { dte_creation: 'DESC' },
      skip: (page - 1) * limite,
      take: limite,
    });
    return paginer(result, pagination);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      ExceptionFactory.notFound(`Notification #${id} not found`);
    }
    notification.lu = true;
    notification.dateLecture = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, lu: false },
      { lu: true, dateLecture: new Date() },
    );
  }

  /** Retourne l'état actif/inactif pour CHAQUE type existant, avec 'true' par défaut. */
  async getPreferencesForUser(
    userId: string,
  ): Promise<Record<NotificationType, boolean>> {
    const saved = await this.preferenceRepository.find({ where: { userId } });
    const savedMap = new Map(saved.map((p) => [p.type, p.active]));

    const result = {} as Record<NotificationType, boolean>;
    for (const type of Object.values(NotificationType)) {
      result[type] = savedMap.get(type) ?? true; // actif par défaut si jamais configuré
    }
    return result;
  }

  async updatePreference(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<void> {
    for (const { type, active } of dto.preferences) {
      const existing = await this.preferenceRepository.findOne({
        where: { userId, type },
      });
      if (existing) {
        existing.active = active;
        await this.preferenceRepository.save(existing);
      } else {
        await this.preferenceRepository.save(
          this.preferenceRepository.create({ userId, type, active }),
        );
      }
    }
  }

  private async isTypeEnabledForUser(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const pref = await this.preferenceRepository.findOne({
      where: { userId, type },
    });
    return pref?.active ?? true; // pas de ligne = actif par défaut
  }
}
