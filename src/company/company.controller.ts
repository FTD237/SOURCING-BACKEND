import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { Roles } from '../decorators/roles.decorator';
import { Company } from './company.entity';

/**
 * Gère le cycle de vie des entreprises (création, consultation, mise à jour,
 * suppression logique). Toutes les routes exigent un JWT valide ; l'accès à
 * chaque route est en plus restreint par rôle via `RolesGuard`.
 */
@ApiTags('Company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Crée une entreprise et le compte utilisateur associé.
   *
   * @param dto - Informations de l'entreprise et de l'utilisateur à créer.
   * @param currentUser - Utilisateur authentifié à l'origine de la création
   * (utilisé pour la traçabilité, ex. `create_by`).
   * @returns L'utilisateur et l'entreprise nouvellement créés.
   * @throws {ConflictException} Si l'email existe déjà (409).
   * @throws {BadRequestException} Si les données fournies sont invalides (400).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer une entreprise',
    description:
      "Crée le compte utilisateur et l'entreprise associée en une seule opération. " +
      'Réservé aux rôles ADMIN, MANAGER et SUPERADMIN.',
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entreprise créée avec succès',
    type: CreateCompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiResponse({
    status: 403,
    description: 'Rôle insuffisant pour créer une entreprise',
  })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  create(
    @Body() dto: CreateCompanyDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<CreateCompanyResponseDto> {
    return this.companyService.create(dto, currentUser);
  }

  /**
   * Liste toutes les entreprises.
   *
   * @returns La liste complète des entreprises.
   */
  @Get()
  @Roles(
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
    RolesEnum.MANAGER,
    RolesEnum.ETUDIANT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les entreprises',
    description:
      'Retourne la liste de toutes les entreprises enregistrées. ' +
      'Accessible aux rôles ADMIN, SUPERADMIN, MANAGER et ETUDIANT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des entreprises récupérée avec succès',
    type: Company,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiResponse({ status: 403, description: 'Rôle insuffisant' })
  findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  /**
   * Récupère une entreprise par son identifiant.
   *
   * @param id - Identifiant UUID de l'entreprise.
   * @returns L'entreprise correspondante.
   * @throws {NotFoundException} Si aucune entreprise ne correspond à `id` (404).
   */
  @Get(':id')
  @Roles(
    RolesEnum.ADMIN,
    RolesEnum.MANAGER,
    RolesEnum.SUPERADMIN,
    RolesEnum.ETUDIANT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer une entreprise par son id',
    description:
      "Retourne les détails complets d'une entreprise à partir de son UUID.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID de l'entreprise à récupérer",
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Entreprise trouvée',
    type: Company,
  })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiResponse({ status: 403, description: 'Rôle insuffisant' })
  @ApiResponse({ status: 404, description: 'Entreprise introuvable' })
  findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  /**
   * Met à jour les informations d'une entreprise.
   *
   * @param id - Identifiant UUID de l'entreprise à modifier.
   * @param dto - Champs à mettre à jour (partiels).
   * @param currentUser - Utilisateur authentifié à l'origine de la modification
   * (utilisé pour la traçabilité, ex. `updated_by`).
   * @returns L'entreprise mise à jour.
   * @throws {NotFoundException} Si aucune entreprise ne correspond à `id` (404).
   * @throws {BadRequestException} Si les données fournies sont invalides (400).
   */
  @Put(':id')
  @Roles(
    RolesEnum.ETUDIANT,
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
    RolesEnum.MANAGER,
    RolesEnum.RH,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier les informations de l'entreprise",
    description:
      "Met à jour partiellement les informations d'une entreprise existante.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID de l'entreprise à modifier",
    format: 'uuid',
  })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Entreprise mise à jour avec succès',
    type: Company,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiResponse({ status: 403, description: 'Rôle insuffisant' })
  @ApiResponse({ status: 404, description: 'Entreprise introuvable' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Company | null> {
    return this.companyService.update(id, dto, currentUser);
  }

  /**
   * Supprime (logiquement) une entreprise.
   *
   * @param id - Identifiant UUID de l'entreprise à supprimer.
   * @param currentUser - Utilisateur authentifié à l'origine de la suppression
   * (utilisé pour la traçabilité).
   * @throws {NotFoundException} Si aucune entreprise ne correspond à `id` (404).
   */
  @Delete(':id')
  @Roles(RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Supprimer une entreprise',
    description:
      'Supprime logiquement une entreprise (statut + date de suppression). ' +
      'Réservé aux rôles MANAGER, ADMIN et SUPERADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: "UUID de l'entreprise à supprimer",
    format: 'uuid',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Entreprise supprimée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiResponse({ status: 403, description: 'Rôle insuffisant' })
  @ApiResponse({ status: 404, description: 'Entreprise introuvable' })
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<void> {
    return this.companyService.remove(id, currentUser);
  }
}
