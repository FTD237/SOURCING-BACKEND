// src/postuler/postuler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postuler } from './postuler.entity';
import { PostulerService } from './postuler.service';
import { PostulerController } from './postuler.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Postuler])],
  controllers: [PostulerController],
  providers: [PostulerService],
  exports: [PostulerService],
})
export class PostulerModule {}
