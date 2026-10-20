import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postuler } from '../postuler/postuler.entity';
import { Offre } from '../offre/offre.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import Company from '../company/company.entity';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Postuler, Offre, Etudiant, Company])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
