// src/company/company.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import Company from './company.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './dto/company.dto';
import { Statut } from '../common/enum/statut.enum';
import { Roles } from '../common/enum/roles.enum';
import { AccountCreationService } from '../common/services/account-creation.service';
import { RechercheCompanyDto } from './dto/recherche.company.dto';
import { paginer, ResultatPagine } from '../common/pagination';

/** Échappe % et _ pour une recherche "contient" sans jokers involontaires. */
const contient = (valeur: string): string =>
  `%${valeur.trim().replace(/[\\%_]/g, '\\$&')}%`; // NOSONAR
@Injectable()
export class CompanyService {
  private static readonly ROLES_VOIR_SUPPRIMES: Roles[] = [
    Roles.ADMIN,
    Roles.MANAGER,
    Roles.SUPERADMIN,
  ];
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly accountCreationService: AccountCreationService,
  ) {}

  async create(
    dto: CreateCompanyDto,
    currentUser: { id: string; email: string },
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
            dte_creation: new Date(),
            isPartner: false,
          });
          return manager.save(company);
        },
      );

    return { user, company };
  }

  async findAll(
    filtre: RechercheCompanyDto,
    currentUser: { id: string; email: string; role: Roles },
  ): Promise<ResultatPagine<Company>> {
    const { page, limite } = filtre;

    this.verifierAccesSupprimes(filtre, currentUser);

    const qb = this.companyRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .leftJoinAndSelect('c.country', 'co');

    this.appliquerFiltreStatut(qb, filtre);

    this.appliquerFiltresIdentifiants(qb, filtre);
    this.appliquerFiltresTexte(qb, filtre);
    this.appliquerFiltresSpecifiques(qb, filtre);
    this.appliquerRechercheLibre(qb, filtre);

    const resultat = await qb
      .orderBy('c.dte_creation', 'DESC')
      .skip((page - 1) * limite)
      .take(limite)
      .getManyAndCount();

    return paginer(resultat, filtre);
  }

  private verifierAccesSupprimes(
    filtre: RechercheCompanyDto,
    currentUser: { role: Roles },
  ): void {
    const veutSupprimes =
      filtre.inclureSupprimes === true || filtre.statut === Statut.SUPPRIME;

    if (
      veutSupprimes &&
      !CompanyService.ROLES_VOIR_SUPPRIMES.includes(currentUser.role)
    ) {
      ExceptionFactory.forbidden(
        'Seuls un admin ou un manager peuvent consulter les entreprises supprimées',
      );
    }
  }

  private appliquerFiltreStatut(
    qb: SelectQueryBuilder<Company>,
    filtre: RechercheCompanyDto,
  ): void {
    if (filtre.statut) {
      qb.andWhere('c.statut = :statut', { statut: filtre.statut });
    } else if (!filtre.inclureSupprimes) {
      qb.andWhere('c.statut <> :supprime', { supprime: Statut.SUPPRIME });
    }
  }

  private appliquerFiltresIdentifiants(
    qb: SelectQueryBuilder<Company>,
    filtre: RechercheCompanyDto,
  ): void {
    if (filtre.id) qb.andWhere('c.id = :id', { id: filtre.id });
    if (filtre.userId)
      qb.andWhere('c.user_id = :userId', { userId: filtre.userId });
    if (filtre.country_code)
      qb.andWhere('c.country_code = :country_code', {
        country_code: filtre.country_code,
      });
  }

  private appliquerFiltresTexte(
    qb: SelectQueryBuilder<Company>,
    filtre: RechercheCompanyDto,
  ): void {
    if (filtre.company_name)
      qb.andWhere('LOWER(c.company_name) LIKE LOWER(:company_name)', {
        company_name: contient(filtre.company_name),
      });
    if (filtre.company_description)
      qb.andWhere(
        'LOWER(c.company_description) LIKE LOWER(:company_description)',
        {
          company_description: contient(filtre.company_description),
        },
      );
    if (filtre.contact_person)
      qb.andWhere('LOWER(c.contact_person) LIKE LOWER(:contact_person)', {
        contact_person: contient(filtre.contact_person),
      });
  }

  private appliquerFiltresSpecifiques(
    qb: SelectQueryBuilder<Company>,
    filtre: RechercheCompanyDto,
  ): void {
    if (filtre.isPartner !== undefined)
      qb.andWhere('c.isPartner = :isPartner', { isPartner: filtre.isPartner });
    if (filtre.recruitment_status)
      qb.andWhere('c.recruitment_status = :recruitment_status', {
        recruitment_status: filtre.recruitment_status,
      });
    if (filtre.minStudentLevel)
      qb.andWhere('c.minStudentLevel = :minStudentLevel', {
        minStudentLevel: filtre.minStudentLevel,
      });
  }

  private appliquerRechercheLibre(
    qb: SelectQueryBuilder<Company>,
    filtre: RechercheCompanyDto,
  ): void {
    if (!filtre.q) return;
    qb.andWhere(
      new Brackets((b) =>
        b
          .where('LOWER(c.company_name) LIKE LOWER(:q)')
          .orWhere('LOWER(c.company_description) LIKE LOWER(:q)')
          .orWhere('LOWER(c.contact_person) LIKE LOWER(:q)'),
      ),
      { q: contient(filtre.q) },
    );
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!company) ExceptionFactory.notFound('Company', `${id}`);
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
      dte_modif: new Date(),
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
