import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { ApiCrudErrorResponses } from '../decorators/api-common-response.decorator';
import { StatisticsDto } from './statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Compteurs globaux : candidatures, offres actives, étudiants, entreprises.
   */
  @Get()
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
  @ApiOperation({
    summary: 'Statistiques globales de la plateforme',
    description:
      "Retourne le nombre de candidatures, d'offres actives, d'étudiants et " +
      "d'entreprises. Les éléments supprimés ne sont pas comptés. " +
      'Accessible aux rôles RH, MANAGER, ADMIN et SUPERADMIN.',
  })
  @ApiOkResponse({
    description: 'Compteurs récupérés avec succès',
    type: StatisticsDto,
  })
  @ApiCrudErrorResponses()
  getResume(): Promise<StatisticsDto> {
    return this.statisticsService.getResume();
  }
}
