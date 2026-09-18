import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offre } from './offre.entity';
import { OffreService } from './offre.service';
import { OffreController } from './offre.controller';
import { Skill } from '../skills/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offre, Skill])],
  providers: [OffreService],
  controllers: [OffreController],
  exports: [OffreService],
})
export class OffreModule {}
