import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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
}
