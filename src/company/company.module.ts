// company.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { Country } from '../entity/country.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Country]), CommonModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
