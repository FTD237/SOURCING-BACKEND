import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etudiant } from './etudiant.entity';
import { EtudiantService } from './etudiant.service';
import { EtudiantController } from './etudiant.controller';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import { ActivationToken } from '../entity/activation-token.entity';
import { CommonModule } from '../common/common.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Etudiant, User, Role, ActivationToken]),
    CommonModule,
    MailModule,
  ],
  providers: [EtudiantService],
  controllers: [EtudiantController],
  exports: [EtudiantService],
})
export class EtudiantModule {}
