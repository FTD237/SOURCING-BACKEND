import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';

interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(email: string, nom: string, password: string) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { nom }],
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      nom,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const access_token = this.jwtService.sign({
      id: user.id,
      email: user.email,
    });

    return {
      access_token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Email ou mot de passe incorrect');
    }

    const access_token = this.jwtService.sign({
      id: user.id,
      email: user.email,
    });

    return {
      access_token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
      },
    };
  }

  validateToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new BadRequestException('Token invalide');
    }
  }
}
