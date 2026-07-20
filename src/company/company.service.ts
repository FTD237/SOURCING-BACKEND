import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './company.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { User } from '../user/user.entity';
import { Role } from '../entity/role.entity';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { generatePassword } from '../common/utils/generate-password';
import { Statut } from '../common/enum/statut.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async create(
    dto: CreateCompanyDto,
    currentUser: { id: string; name: string },
  ): Promise<CreateCompanyResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser)
      ExceptionFactory.businessConflict(
        'Company',
        `Un utilisateur avec l'email ${dto.email} existe déjà`,
      );

    const roleCompany = await this.roleRepository.findOne({
      where: { nom: 'rh' },
    });

    if (!roleCompany) {
      ExceptionFactory.businessConflict('Company', `Le rôle "rh" n'éxiste pas`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const createdBy = currentUser.id;

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        id_role: roleCompany.id,
        statut: Statut.ACTIF,
        created_at: createdBy,
      });

      const savedUser = await queryRunner.manager.save(user);

      const company = queryRunner.manager.create(Company, {
        user_id: savedUser.id,
        country_code: dto.country_code,
        statut: Statut.ACTIF,
        create_by: createdBy,
      });

      const savedCompany = await queryRunner.manager.save(company);

      await queryRunner.commitTransaction();

      return {
        user: savedUser,
        company: savedCompany,
        generatedPassword: generatedPassword,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      ExceptionFactory.database(error, 'Company');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!company)
      ExceptionFactory.notFound('Company', `Entreprises #${id} introuvable`);
    return company;
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    currentUser: { id: string; email: string },
  ): Promise<Company | null> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!company) ExceptionFactory.notFound('Company', id);

    const { nom, prenom, country_code, ...companyFields } = dto;

    if (nom || prenom || country_code) {
      await this.companyRepository.update(company.user.id, {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(country_code && { country_code }),
      });
    }

    await this.companyRepository.update(id, {
      ...companyFields,
      updated_by: currentUser.id,
    });

    return this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async remove(
    id: string,
    currentUser: { id: string; email: string },
  ): Promise<void> {
    const company = await this.findOne(id);
    company.statut = Statut.SUPPRIME;
    company.dte_suppression = new Date();
    company.updated_by = currentUser.id;

    try {
      await this.companyRepository.save(company);
    } catch (error) {
      ExceptionFactory.database(error, 'Company');
    }
  }
}
