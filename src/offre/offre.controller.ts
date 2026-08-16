// src/offre/offre.controller.ts
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OffreService } from './offre.service';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';
import { Offre } from './offre.entity';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('Offre')
@ApiBearerAuth()
@Controller('offres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffreController {
  constructor(private readonly offreService: OffreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolesEnum.RH, RolesEnum.MANAGER)
  @ApiOperation({
    summary: 'Créer une offre',
    description:
      "Crée une nouvelle offre. Réservé aux rôles RH et MANAGER. L'identifiant de l'utilisateur courant est enregistré comme créateur.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Offre créée avec succès.',
    type: Offre,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Rôle insuffisant pour créer une offre.',
  })
  create(
    @Body() dto: CreateOffreDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Offre> {
    return this.offreService.create(dto, currentUser);
  }

  @Get()
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ETUDIANT)
  @ApiOperation({
    summary: 'Lister toutes les offres',
    description: 'Retourne la liste de toutes les offres actives.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des offres.',
    type: [Offre],
  })
  findAll(): Promise<Offre[]> {
    return this.offreService.findAll();
  }

  @Get(':id')
  @Roles(RolesEnum.RH, RolesEnum.MANAGER, RolesEnum.ETUDIANT)
  @ApiOperation({ summary: 'Récupérer une offre par son id' })
  @ApiParam({ name: 'id', description: "UUID de l'offre" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Offre trouvée.',
    type: Offre,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Offre introuvable.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Offre> {
    return this.offreService.findOne(id);
  }

  @Put(':id')
  @Roles(RolesEnum.RH, RolesEnum.MANAGER)
  @ApiOperation({
    summary: 'Mettre à jour une offre',
    description: 'Met à jour partiellement ou totalement une offre existante.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'offre" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Offre mise à jour.',
    type: Offre,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Offre introuvable.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOffreDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Offre> {
    return this.offreService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolesEnum.RH, RolesEnum.MANAGER)
  @ApiOperation({
    summary: 'Supprimer une offre',
    description: 'Supprime (soft delete) une offre existante.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'offre" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Offre supprimée.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Offre introuvable.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<void> {
    return this.offreService.remove(id, currentUser);
  }
}
