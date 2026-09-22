import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationPreference])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService], // ← indispensable pour l'utiliser depuis d'autres modules
})
export class NotificationModule {}
