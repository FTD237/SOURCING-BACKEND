import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { GetUser } from '../auth/get-user.decorator';
import { PaginationDto } from '../common/pagination';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationPagineeDto } from './dto/evaluation-paginee.dto';
import { Evaluation } from './evaluation.entity';

interface UtilisateurCourant {
  id: string;
  companyId: string;
}

@ApiTags('Évaluations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT absent ou invalide' })
@Controller('evaluation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @Roles(RolesEnum.RH)
  @ApiOperation({
    summary: 'Évaluer un étudiant pour une expérience',
    description:
      "Réservé aux RH. L'expérience doit appartenir à l'entreprise, être terminée et ne pas avoir déjà d'évaluation active. La moyenne (`star_rate`) de l'étudiant est recalculée.",
  })
  @ApiCreatedResponse({ description: 'Évaluation créée', type: Evaluation })
  @ApiBadRequestResponse({
    description: 'Données invalides ou expérience non terminée',
  })
  @ApiForbiddenResponse({
    description: "L'expérience n'appartient pas à votre entreprise",
  })
  @ApiNotFoundResponse({ description: 'Expérience introuvable' })
  @ApiConflictResponse({ description: 'Cette expérience a déjà été évaluée' })
  create(
    @Body() dto: CreateEvaluationDto,
    @GetUser() user: UtilisateurCourant,
  ) {
    return this.evaluationService.create(user.companyId, dto, user);
  }

  @Get('etudiant/:studentId')
  @ApiOperation({
    summary: "Lister les évaluations d'un étudiant",
    description: 'Résultat paginé. Les évaluations supprimées sont exclues.',
  })
  @ApiParam({
    name: 'studentId',
    description: "Identifiant de l'étudiant",
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Liste paginée des évaluations',
    type: EvaluationPagineeDto,
  })
  @ApiBadRequestResponse({
    description: 'Identifiant ou paramètres de pagination invalides',
  })
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.evaluationService.findByStudent(studentId, pagination);
  }

  @Patch(':id')
  @Roles(RolesEnum.RH)
  @ApiOperation({
    summary: 'Modifier une évaluation',
    description:
      "Permet de modifier la note et/ou le commentaire. L'expérience évaluée ne peut pas être changée.",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'évaluation",
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Évaluation mise à jour', type: Evaluation })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  @ApiForbiddenResponse({
    description: "Cette évaluation n'appartient pas à votre entreprise",
  })
  @ApiNotFoundResponse({ description: 'Évaluation introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationDto,
    @GetUser() user: UtilisateurCourant,
  ) {
    return this.evaluationService.update(user.companyId, id, dto, user);
  }

  @Delete(':id')
  @Roles(RolesEnum.RH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une évaluation',
    description:
      "Suppression logique (statut `SUPPRIME`). La moyenne de l'étudiant est recalculée.",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'évaluation",
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Évaluation supprimée' })
  @ApiForbiddenResponse({
    description: "Cette évaluation n'appartient pas à votre entreprise",
  })
  @ApiNotFoundResponse({ description: 'Évaluation introuvable' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UtilisateurCourant,
  ) {
    return this.evaluationService.remove(user.companyId, id, user);
  }
}
