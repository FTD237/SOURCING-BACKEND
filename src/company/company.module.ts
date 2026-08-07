import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { Country } from '../entity/country.entity';
import { CommonModule } from '../common/common.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Role, Country]),
    CommonModule,
    MailModule,
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
