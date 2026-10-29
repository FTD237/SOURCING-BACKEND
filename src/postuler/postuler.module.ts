// src/postuler/postuler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { PostulerService } from './postuler.service';
import { PostulerController } from './postuler.controller';
import { NotificationModule } from '../notifications/notification.module';
import { PostulerLifecycleService } from './postuler-lifecycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([Postuler]), NotificationModule],
  controllers: [PostulerController],
  providers: [PostulerService, PostulerLifecycleService],
  exports: [PostulerService],
})
export class PostulerModule {}
