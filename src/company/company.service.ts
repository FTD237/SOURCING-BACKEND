// src/company/company.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { Statut } from '../common/enum/statut.enum';
import { Roles } from '../common/enum/roles.enum';
import { AccountCreationService } from '../common/services/account-creation.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly accountCreationService: AccountCreationService,
  ) {}

  async create(
    dto: CreateCompanyDto,
    currentUser: { id: string; name: string },
  ): Promise<CreateCompanyResponseDto> {
    await this.accountCreationService.checkEmailAvailable(dto.email, 'Company');

    const roleCompany = await this.accountCreationService.findRoleOrFail(
      Roles.RH,
      'Le rôle "rh" n\'existe pas. Veuillez le créer avant',
    );

    const { user, entity: company } =
      await this.accountCreationService.createUserWithActivation<Company>(
        {
          email: dto.email,
          nom: dto.nom,
          prenom: dto.prenom,
          roleId: roleCompany.id,
          createdBy: currentUser.id,
          contextEntity: 'Company',
        },
        async (manager, savedUser) => {
          const company = manager.create(Company, {
            user_id: savedUser.id,
            country_code: dto.country_code,
            statut: Statut.ACTIF,
            create_by: currentUser.id,
          });
          return manager.save(company);
        },
      );

    return { user, company };
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
      ExceptionFactory.notFound('Company', `${id}`);
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
