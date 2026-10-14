// jobseeker/jobseeker.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JobseekerService } from './jobseeker.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { GetUser } from '../auth/get-user.decorator';
import { PaginationDto } from '../common/pagination';
import { UpsertJobseekerDto } from './dto/upsert-jobseeker.dto';
import { JobseekerPaginateDto } from './dto/jobseeker-paginate.dto';
import { Jobseeker } from './jobseeker.entity';

// `etudiantId` : à adapter à ce que renvoie ton GetUser
interface UtilisateurCourant {
  id: string;
  etudiantId: string;
}

@ApiTags('Jobseekers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT absent ou invalide' })
@Controller('jobseeker')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobseekerController {
  constructor(private readonly jobseekerService: JobseekerService) {}

  @Get()
  @Roles(RolesEnum.RH)
  @ApiOperation({
    summary: "Lister les étudiants en recherche d'emploi",
    description: 'Résultat paginé. Les profils désactivés sont exclus.',
  })
  @ApiOkResponse({ type: JobseekerPaginateDto })
  findAll(@Query() pagination: PaginationDto) {
    return this.jobseekerService.findAll(pagination);
  }

  @Get('me')
  @Roles(RolesEnum.ETUDIANT)
  @ApiOperation({ summary: "Consulter mon profil de recherche d'emploi" })
  @ApiOkResponse({ type: Jobseeker })
  @ApiNotFoundResponse({ description: "Vous n'êtes pas en recherche d'emploi" })
  findMine(@GetUser() user: UtilisateurCourant) {
    return this.jobseekerService.findByStudent(user.etudiantId);
  }

  @Put('me')
  @Roles(RolesEnum.ETUDIANT)
  @ApiOperation({
    summary: "Passer en recherche d'emploi ou mettre à jour mon profil",
    description:
      "Met `is_job_seeker` à true sur l'étudiant et crée (ou réactive) sa ligne jobseeker. Idempotent.",
  })
  @ApiOkResponse({ type: Jobseeker })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant' })
  activate(
    @Body() dto: UpsertJobseekerDto,
    @GetUser() user: UtilisateurCourant,
  ) {
    return this.jobseekerService.activer(user.etudiantId, dto, user);
  }

  @Delete('me')
  @Roles(RolesEnum.ETUDIANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Quitter la recherche d'emploi",
    description:
      'Met `is_job_seeker` à false et supprime logiquement la ligne jobseeker.',
  })
  @ApiNoContentResponse({ description: 'Profil désactivé' })
  deactivate(@GetUser() user: UtilisateurCourant) {
    return this.jobseekerService.desactiver(user.etudiantId, user);
  }
}
