import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from './user/user.module';
import { EtudiantModule } from './etudiant/etudiant.module';
import { ExperienceModule } from './experience/experience.module';
import { OffreModule } from './offre/offre.module';
import { SkillModule } from './skills/skill.module';
import { FormationModule } from './formation/formation.module';
import { PromotionModule } from './promotion/promotion.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';
import { FileModule } from './file/file.module';
import { PostulerModule } from './postuler/postuler.module';
import { EtudiantSkillModule } from './etudiant-skill/etudiant-skill.module';
import { NotificationModule } from './notifications/notification.module';
import { buildDatabaseOptions, getAppEnv } from './config/database.config';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${getAppEnv()}`,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDatabaseOptions((k) => config.get<string>(k)),
        autoLoadEntities: true,
      }),
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRE_IN') ?? '30d',
          },
        };
      },
    }),

    AuthModule,
    UserModule,
    EtudiantModule,
    ExperienceModule,
    OffreModule,
    SkillModule,
    FormationModule,
    PromotionModule,
    CompanyModule,
    MailModule,
    FileModule,
    PostulerModule,
    EtudiantSkillModule,
    NotificationModule,
    EvaluationModule
  ],
})
export class AppModule {}
