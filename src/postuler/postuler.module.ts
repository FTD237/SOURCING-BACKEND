// src/postuler/postuler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { PostulerService } from './postuler.service';
import { PostulerController } from './postuler.controller';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Postuler]), NotificationModule],
  controllers: [PostulerController],
  providers: [PostulerService],
  exports: [PostulerService],
})
export class PostulerModule {}
