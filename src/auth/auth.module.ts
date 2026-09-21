import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt-strategy';
import { User } from '../user/user.entity';
import { MailModule } from '../mail/mail.module';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Company } from '../company/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Etudiant, Company]),
    PassportModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
