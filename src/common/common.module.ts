// src/common/common.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivationTokenService } from './services/activation-token.service';
import { AccountCreationService } from './services/account-creation.service';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { MailModule } from '../mail/mail.module';
import { LinkCheckerService } from './services/link-checker.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), MailModule],
  providers: [
    ActivationTokenService,
    AccountCreationService,
    LinkCheckerService,
  ],
  exports: [ActivationTokenService, AccountCreationService, LinkCheckerService],
})
export class CommonModule {}
