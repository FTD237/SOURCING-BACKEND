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
import { EtudiantService } from './etudiant.service';
import {
  CreateEtudiantDto,
  CreateEtudiantResponseDto,
  UpdateEtudiantDto,
} from './etudiant.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Etudiant } from './etudiant.entity';
import {
  ApiCrudErrorResponses,
  ApiUuidParam,
} from '../decorators/api-common-response.decorator';

/**
 * Gère le cycle de vie des étudiants (création, consultation, mise à jour,
 * suppression logique). Toutes les routes exigent un JWT valide ; l'accès à
 * chaque route est en plus restreint par rôle via `RolesGuard`.
 */
@ApiTags('Etudiant')
@Controller('etudiants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EtudiantController {
  constructor(private readonly etudiantService: EtudiantService) {}

  /**
   * Crée un étudiant et le compte utilisateur associé. Le mot de passe est
   * généré automatiquement côté service et renvoyé dans la réponse.
   *
   * @param dto - Informations de l'étudiant et de l'utilisateur à créer.
   * @param currentUser - Utilisateur authentifié à l'origine de la création
   * (utilisé pour la traçabilité, ex. `create_by`).
   * @returns L'utilisateur et le profil étudiant nouvellement créés.
   * @throws ConflictException si l'email existe déjà (409).
   * @throws BadRequestException si les données fournies sont invalides (400).
   */
  @Post()
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer un étudiant (utilisateur + profil)',
    description:
      'Crée le compte utilisateur et le profil étudiant associé en une seule ' +
      'opération. Le mot de passe est généré automatiquement et retourné dans ' +
      'la réponse. Réservé aux rôles ADMIN, MANAGER et SUPERADMIN.',
  })
  @ApiBody({ type: CreateEtudiantDto })
  @ApiResponse({
    status: 201,
    description: 'Étudiant créé avec succès',
    type: CreateEtudiantResponseDto,
  })
  @ApiCrudErrorResponses({ badRequest: true, conflict: 'Email déjà existant' })
  create(
    @Body() dto: CreateEtudiantDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<CreateEtudiantResponseDto> {
    return this.etudiantService.create(dto, currentUser);
  }

  /**
   * Liste tous les étudiants.
   *
   * @returns La liste complète des étudiants.
   */
  @Get()
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les étudiants',
    description:
      'Retourne la liste de tous les étudiants enregistrés. Accessible aux ' +
      'rôles RH, MANAGER, ADMIN et SUPERADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des étudiants récupérée avec succès',
    type: Etudiant,
    isArray: true,
  })
  @ApiCrudErrorResponses()
  findAll(): Promise<Etudiant[]> {
    return this.etudiantService.findAll();
  }

  /**
   * Récupère un étudiant par son identifiant.
   *
   * @param id - Identifiant UUID de l'étudiant.
   * @returns L'étudiant correspondant.
   * @throws NotFoundException si aucun étudiant ne correspond à `id` (404).
   */
  @Get(':id')
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un étudiant par son id',
    description:
      "Retourne les détails complets d'un étudiant à partir de son UUID.",
  })
  @ApiUuidParam('id', "UUID de l'étudiant à récupérer")
  @ApiResponse({
    status: 200,
    description: 'Étudiant trouvé',
    type: Etudiant,
  })
  @ApiCrudErrorResponses({ notFound: 'Étudiant' })
  findOne(@Param('id') id: string): Promise<Etudiant> {
    return this.etudiantService.findOne(id);
  }

  /**
   * Met à jour les informations d'un étudiant.
   *
   * @param id - Identifiant UUID de l'étudiant à modifier.
   * @param dto - Champs à mettre à jour (partiels).
   * @param currentUser - Utilisateur authentifié à l'origine de la modification
   * (utilisé pour la traçabilité, ex. `updated_by`).
   * @returns L'étudiant mis à jour.
   * @throws NotFoundException si aucun étudiant ne correspond à `id` (404).
   * @throws BadRequestException si les données fournies sont invalides (400).
   */
  @Put(':id')
  @Roles(
    RolesEnum.ETUDIANT,
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
    RolesEnum.MANAGER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier les informations d'un étudiant",
    description:
      "Met à jour partiellement les informations d'un étudiant existant.",
  })
  @ApiUuidParam('id', "UUID de l'étudiant à modifier")
  @ApiBody({ type: UpdateEtudiantDto })
  @ApiResponse({
    status: 200,
    description: 'Étudiant mis à jour avec succès',
    type: Etudiant,
  })
  @ApiCrudErrorResponses({ badRequest: true, notFound: 'Étudiant' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEtudiantDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Etudiant | null> {
    return this.etudiantService.update(id, dto, currentUser);
  }

  /**
   * Supprime (logiquement) un étudiant.
   *
   * @param id - Identifiant UUID de l'étudiant à supprimer.
   * @param currentUser - Utilisateur authentifié à l'origine de la suppression
   * (utilisé pour la traçabilité).
   * @throws NotFoundException si aucun étudiant ne correspond à `id` (404).
   */
  @Delete(':id')
  @Roles(RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Supprimer un étudiant',
    description:
      'Supprime logiquement un étudiant (statut + date de suppression). ' +
      'Réservé aux rôles MANAGER, ADMIN et SUPERADMIN.',
  })
  @ApiUuidParam('id', "UUID de l'étudiant à supprimer")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Étudiant supprimé avec succès',
  })
  @ApiCrudErrorResponses({ notFound: 'Étudiant' })
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<void> {
    return this.etudiantService.remove(id, currentUser);
  }
}
