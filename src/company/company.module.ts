import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { Country } from '../entity/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Role, Country])],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
