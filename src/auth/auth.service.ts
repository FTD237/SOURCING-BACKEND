import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { User } from '../user/user.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { MailService } from '../mail/mail.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      ExceptionFactory.badRequest('Email ou mot de passe incorect');

    const access_token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role.nom,
    });

    return {
      access_token,
      user: { id: user.id, nom: user.nom, email: user.email },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Réponse volontairement identique que le compte existe ou non,
    // pour ne pas permettre l'énumération des emails inscrits.
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = this.hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetMail(
      user.email,
      resetLink,
      user.nom,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });

    if (
      !user?.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      ExceptionFactory.badRequest('Token invalide ou expiré');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
