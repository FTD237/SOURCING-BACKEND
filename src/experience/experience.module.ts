import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experience } from './experience.entity';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Experience])],
  providers: [ExperienceService],
  controllers: [ExperienceController],
  exports: [ExperienceService],
})
export class ExperienceModule {}
