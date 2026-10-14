import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experience } from './experience.entity';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';
import { FileEntity } from '../file/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Experience, FileEntity])],
  providers: [ExperienceService],
  controllers: [ExperienceController],
  exports: [ExperienceService],
})
export class ExperienceModule {}
