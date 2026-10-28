import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Statut } from '../common/enum/statut.enum';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };
    super(options);
  }

  /**
   * Re-vérifie l'utilisateur en base à chaque requête authentifiée :
   * un token JWT reste cryptographiquement valide jusqu'à expiration
   * même si le compte a été supprimé ou désactivé entre-temps.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findOne({
      where: { id: payload.id },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (user.statut !== Statut.ACTIF) {
      throw new UnauthorizedException('Compte utilisateur inactif');
    }

    return { id: user.id, email: user.email, role: payload.role };
  }
}
