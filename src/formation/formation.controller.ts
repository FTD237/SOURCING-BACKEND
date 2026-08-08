// src/formation/formation.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FormationService } from './formation.service';
import { CreateFormationDto, UpdateFormationDto } from './formation.dto';
import { Formation } from './formation.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';

/**
 * Gère le référentiel des formations proposées (création, consultation,
 * mise à jour, suppression logique). Une formation est une entité de
 * référence généralement associée aux promotions et aux étudiants.
 *
 * Toutes les routes exigent un token JWT valide (JwtAuthGuard) et un rôle
 * autorisé (RolesGuard) — voir le détail des rôles requis par endpoint
 * ci-dessous.
 */
@ApiTags('Formation')
@Controller('formations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormationController {
  constructor(private readonly formationService: FormationService) {}

  /**
   * Crée une nouvelle formation dans le référentiel.
   *
   * Réservé aux rôles administratifs : une formation impacte l'ensemble
   * des promotions et étudiants qui pourront y être rattachés.
   */
  @Post()
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer une formation',
    description:
      'Créer une nouvelle formation dans le référentiel. Réservé aux ' +
      'rôles admin, manager et superadmin.',
  })
  @ApiBody({ type: CreateFormationDto })
  @ApiResponse({
    status: 201,
    description: 'Formation créée avec succès',
    type: Formation,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (validation DTO échouée)',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT manquant ou invalide',
  })
  @ApiResponse({
    status: 403,
    description: 'Rôle insuffisant pour créer une formation',
  })
  @ApiResponse({
    status: 409,
    description: 'Une formation avec ce nom (ou ce code) existe déjà',
  })
  create(@Body() dto: CreateFormationDto): Promise<Formation> {
    return this.formationService.create(dto);
  }

  /**
   * Récupère la liste complète des formations du référentiel.
   *
   * Accessible à tous les rôles métier ayant besoin de consulter le
   * référentiel (RH, manager, admin, superadmin).
   *
   * ⚠️ Retourne aussi les formations au statut SUPPRIME (soft delete) :
   * le filtrage sur `statut` reste à la charge de l'appelant si besoin.
   */
  @Get()
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les formations',
    description: 'Récupérer la liste de toutes les formations existantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des formations récupérée avec succès',
    type: Formation,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT manquant ou invalide',
  })
  findAll(): Promise<Formation[]> {
    return this.formationService.findAll();
  }

  /**
   * Récupère le détail d'une formation via son identifiant (UUID).
   */
  @Get(':id')
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer une formation par ID',
    description:
      "Récupérer le détail complet d'une formation via son identifiant.",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID de la formation',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Formation récupérée avec succès',
    type: Formation,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT manquant ou invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Aucune formation ne correspond à cet ID',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Formation> {
    return this.formationService.findOne(id);
  }

  /**
   * Met à jour partiellement une formation existante.
   *
   * Réservé aux rôles administratifs. Le champ `statut` peut aussi être
   * modifié via cet endpoint (en plus de `remove()` qui le positionne
   * automatiquement sur SUPPRIME).
   */
  @Put(':id')
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mettre à jour une formation',
    description: "Mettre à jour les informations d'une formation existante.",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID de la formation à mettre à jour',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateFormationDto })
  @ApiResponse({
    status: 200,
    description: 'Mise à jour réussie',
    type: Formation,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (validation DTO échouée)',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT manquant ou invalide',
  })
  @ApiResponse({
    status: 403,
    description: 'Rôle insuffisant pour modifier une formation',
  })
  @ApiResponse({
    status: 404,
    description: 'Aucune formation ne correspond à cet ID',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormationDto,
  ): Promise<Formation> {
    return this.formationService.update(id, dto);
  }

  /**
   * Supprime (logiquement) une formation du référentiel : positionne
   * `statut` à SUPPRIME et `dte_suppression` à la date courante, sans
   * supprimer la ligne en base (soft delete).
   */
  @Delete(':id')
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Supprimer une formation',
    description:
      'Suppression logique (soft delete) : la formation est marquée ' +
      'SUPPRIME plutôt que supprimée de la base.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID de la formation à supprimer',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Formation supprimée avec succès (pas de contenu retourné)',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT manquant ou invalide',
  })
  @ApiResponse({
    status: 403,
    description: 'Rôle insuffisant pour supprimer une formation',
  })
  @ApiResponse({
    status: 404,
    description: 'Aucune formation ne correspond à cet ID',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.formationService.remove(id);
  }
}
