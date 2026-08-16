// src/postuler/postuler.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostulerService } from './postuler.service';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { Postuler } from './postuler.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Postuler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('postuler')
export class PostulerController {
  constructor(private readonly postulerService: PostulerService) {}

  @Post()
  @ApiOperation({
    summary: 'Postuler à une offre',
    description:
      "Crée une candidature : un étudiant postule à une offre donnée. Échoue si l'étudiant a déjà postulé à cette même offre.",
  })
  @ApiResponse({
    status: 201,
    description: 'Candidature créée avec succès.',
    type: Postuler,
  })
  @ApiResponse({
    status: 409,
    description: 'Cet étudiant a déjà postulé à cette offre.',
  })
  @Roles(RolesEnum.RH)
  create(
    @Body() dto: CreatePostulerDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Postuler> {
    return this.postulerService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les candidatures',
    description:
      'Retourne toutes les candidatures existantes, triées par date décroissante, avec les relations offre et étudiant chargées.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des candidatures.',
    type: [Postuler],
  })
  @Roles(RolesEnum.MANAGER, RolesEnum.ETUDIANT)
  findAll(): Promise<Postuler[]> {
    return this.postulerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une candidature par son id' })
  @ApiParam({ name: 'id', description: 'UUID de la candidature' })
  @ApiResponse({
    status: 200,
    description: 'Candidature trouvée.',
    type: Postuler,
  })
  @ApiResponse({ status: 404, description: 'Candidature introuvable.' })
  @Roles(RolesEnum.MANAGER, RolesEnum.ETUDIANT, RolesEnum.RH)
  findOne(@Param('id') id: string): Promise<Postuler> {
    return this.postulerService.findOne(id);
  }

  @Get('etudiant/:etudiantId')
  @ApiOperation({
    summary: "Lister les candidatures d'un étudiant",
    description:
      'Retourne toutes les offres auxquelles un étudiant donné a postulé.',
  })
  @ApiParam({ name: 'etudiantId', description: "UUID de l'étudiant" })
  @ApiResponse({
    status: 200,
    description: "Candidatures de l'étudiant.",
    type: [Postuler],
  })
  @Roles(RolesEnum.MANAGER, RolesEnum.RH)
  findByEtudiant(@Param('etudiantId') etudiantId: string): Promise<Postuler[]> {
    return this.postulerService.findByEtudiant(etudiantId);
  }

  @Get('offre/:offreId')
  @ApiOperation({
    summary: 'Lister les candidatures reçues pour une offre',
    description:
      'Retourne tous les étudiants ayant postulé à une offre donnée.',
  })
  @ApiParam({ name: 'offreId', description: "Identifiant de l'offre" })
  @ApiResponse({
    status: 200,
    description: "Candidatures reçues pour l'offre.",
    type: [Postuler],
  })
  @Roles(RolesEnum.MANAGER, RolesEnum.ETUDIANT, RolesEnum.RH)
  findByOffre(@Param('offreId') offreId: string): Promise<Postuler[]> {
    return this.postulerService.findByOffre(offreId);
  }

  @Patch(':id/statut')
  @ApiOperation({
    summary: "Mettre à jour le statut d'une candidature",
    description:
      "Fait évoluer le statut métier d'une candidature (ex: EN_ATTENTE → ACCEPTEE ou REFUSEE).",
  })
  @ApiParam({ name: 'id', description: 'UUID de la candidature' })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour.',
    type: Postuler,
  })
  @ApiResponse({ status: 404, description: 'Candidature introuvable.' })
  @Roles(RolesEnum.RH)
  updateStatut(
    @Param('id') id: string,
    @Body() dto: UpdatePostulerStatutDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<Postuler> {
    return this.postulerService.updateStatut(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Retirer une candidature',
    description: 'Supprime (soft delete) une candidature existante.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la candidature' })
  @ApiResponse({ status: 200, description: 'Candidature supprimée.' })
  @ApiResponse({ status: 404, description: 'Candidature introuvable.' })
  @Roles(RolesEnum.MANAGER, RolesEnum.ETUDIANT)
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<void> {
    return this.postulerService.remove(id, currentUser);
  }
}
