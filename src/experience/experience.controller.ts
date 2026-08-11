import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Experience } from './experience.entity';
import {
  ApiCrudErrorResponses,
  ApiUuidParam,
} from '../decorators/api-common-response.decorator';

/**
 * Gère le cycle de vie des expériences étudiantes (création, consultation,
 * mise à jour, suppression logique). Toutes les routes exigent un JWT valide ;
 * l'accès à chaque route est en plus restreint par rôle via `RolesGuard`.
 *
 * ATTENTION : les rôles ci-dessous sont calqués par analogie sur
 * `EtudiantController` (aucune règle métier n'était définie dans le fichier
 * d'origine, qui n'avait aucune protection). À ajuster si nécessaire.
 */
@ApiTags('Experience')
@Controller('experiences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  /**
   * Crée une expérience pour un étudiant.
   *
   * @param dto - Informations de l'expérience à créer.
   * @returns L'expérience nouvellement créée.
   * @throws BadRequestException si une expérience équivalente existe déjà (400).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer une expérience',
    description:
      'Crée une expérience (stage, alternance, etc.) associée à un étudiant. ' +
      'Réservé aux rôles ADMIN, MANAGER et SUPERADMIN.',
  })
  @ApiBody({ type: CreateExperienceDto })
  @ApiResponse({
    status: 201,
    description: 'Expérience créée avec succès',
    type: Experience,
  })
  @ApiCrudErrorResponses({
    badRequest: 'Expérience existante ou données invalides',
  })
  create(@Body() dto: CreateExperienceDto): Promise<Experience> {
    return this.experienceService.create(dto);
  }

  /**
   * Liste toutes les expériences.
   *
   * @returns La liste complète des expériences.
   */
  @Get()
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les expériences',
    description:
      'Retourne la liste de toutes les expériences enregistrées. Accessible ' +
      'aux rôles RH, MANAGER, ADMIN et SUPERADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des expériences récupérée avec succès',
    type: Experience,
    isArray: true,
  })
  @ApiCrudErrorResponses()
  findAll(): Promise<Experience[]> {
    return this.experienceService.findAll();
  }

  /**
   * Liste les expériences d'un étudiant donné.
   *
   * @param studentId - Identifiant UUID de l'étudiant.
   * @returns Les expériences associées à cet étudiant.
   */
  @Get('etudiant/:studentId')
  @Roles(
    RolesEnum.ETUDIANT,
    RolesEnum.RH,
    RolesEnum.MANAGER,
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer les expériences d'un étudiant",
    description:
      "Retourne toutes les expériences associées à l'UUID d'un étudiant donné.",
  })
  @ApiUuidParam('studentId', "UUID de l'étudiant")
  @ApiResponse({
    status: 200,
    description: "Expériences de l'étudiant récupérées avec succès",
    type: Experience,
    isArray: true,
  })
  @ApiCrudErrorResponses()
  findByEtudiant(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<Experience[]> {
    return this.experienceService.findByEtudiant(studentId);
  }

  /**
   * Récupère une expérience par son identifiant.
   *
   * @param id - Identifiant UUID de l'expérience.
   * @returns L'expérience correspondante.
   * @throws NotFoundException si aucune expérience ne correspond à `id` (404).
   */
  @Get(':id')
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer une expérience par son id',
    description:
      "Retourne les détails complets d'une expérience à partir de son UUID.",
  })
  @ApiUuidParam('id', "UUID de l'expérience à récupérer")
  @ApiResponse({
    status: 200,
    description: 'Expérience trouvée',
    type: Experience,
  })
  @ApiCrudErrorResponses({ notFound: 'Expérience' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Experience> {
    return this.experienceService.findOne(id);
  }

  /**
   * Met à jour les informations d'une expérience.
   *
   * @param id - Identifiant UUID de l'expérience à modifier.
   * @param dto - Champs à mettre à jour (partiels).
   * @returns L'expérience mise à jour.
   * @throws NotFoundException si aucune expérience ne correspond à `id` (404).
   * @throws BadRequestException si les données fournies sont invalides (400).
   */
  @Put(':id')
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Modifier une expérience',
    description:
      "Met à jour partiellement les informations d'une expérience existante.",
  })
  @ApiUuidParam('id', "UUID de l'expérience à modifier")
  @ApiBody({ type: UpdateExperienceDto })
  @ApiResponse({
    status: 200,
    description: 'Expérience mise à jour avec succès',
    type: Experience,
  })
  @ApiCrudErrorResponses({ badRequest: true, notFound: 'Expérience' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExperienceDto,
  ): Promise<Experience> {
    return this.experienceService.update(id, dto);
  }

  /**
   * Supprime (logiquement) une expérience.
   *
   * @param id - Identifiant UUID de l'expérience à supprimer.
   * @throws NotFoundException si aucune expérience ne correspond à `id` (404).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Supprimer une expérience',
    description:
      'Supprime logiquement une expérience (statut + date de suppression). ' +
      'Réservé aux rôles ADMIN, MANAGER et SUPERADMIN.',
  })
  @ApiUuidParam('id', "UUID de l'expérience à supprimer")
  @ApiResponse({
    status: 204,
    description: 'Expérience supprimée avec succès',
  })
  @ApiCrudErrorResponses({ notFound: 'Expérience' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.experienceService.remove(id);
  }
}
