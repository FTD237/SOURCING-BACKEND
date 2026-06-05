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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_NAME'),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
          logging: !isProduction,
          ssl: isProduction,
          ...(isProduction && {
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
            },
          }),
        };
      },
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
  ],
})
export class AppModule {}
