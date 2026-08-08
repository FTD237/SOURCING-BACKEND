// src/common/common.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivationTokenService } from './services/activation-token.service';
import { AccountCreationService } from './services/account-creation.service';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), MailModule],
  providers: [
    ActivationTokenService,
    AccountCreationService /* autres services */,
  ],
  exports: [ActivationTokenService, AccountCreationService],
})
export class CommonModule {}
