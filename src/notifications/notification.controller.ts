import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdatePreferencesDto } from './notification.dto';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { PaginationDto } from '../common/pagination';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { ApiReponsePaginee } from '../common/swagger';
import { NotificationType } from '../common/enum/notification-type.enum';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: "Liste les notifications de l'utilisateur connecté",
    description:
      'Retourne les notifications paginées, triées par défaut du plus récent au plus ancien.',
  })
  @ApiReponsePaginee(Notification, 'Liste paginée des notifications')
  findAll(
    @Query() pagination: PaginationDto,
    @GetUser() currentUser: { id: string },
  ) {
    return this.notificationService.findAllForUser(currentUser.id, pagination);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marque une notification comme lue' })
  @ApiParam({ name: 'id', description: 'Identifiant de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme lue',
    type: Notification,
  })
  @ApiResponse({ status: 404, description: 'Notification introuvable' })
  markAsRead(@Param('id') id: string, @GetUser() currentUser: { id: string }) {
    return this.notificationService.markAsRead(id, currentUser.id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: "Marque toutes les notifications de l'utilisateur comme lues",
  })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications ont été marquées comme lues',
  })
  markAllAsRead(@GetUser() currentUser: { id: string }) {
    return this.notificationService.markAllAsRead(currentUser.id);
  }

  @Get('preferences')
  @ApiOperation({
    summary: "Récupère les préférences de notification de l'utilisateur",
    description:
      'Retourne, pour chaque type de notification, si elle est activée. ' +
      "Un type que l'utilisateur n'a jamais configuré est actif par défaut.",
  })
  @ApiOkResponse({
    description:
      'Préférences de notification, indexées par type (true = activée)',
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.values(NotificationType).map((type) => [
          type,
          { type: 'boolean' },
        ]),
      ),
      required: Object.values(NotificationType),
      example: {
        NOUVELLE_OFFRE: true,
        CANDIDATURE_RECUE: true,
        CANDIDATURE_ACCEPTEE: true,
        CANDIDATURE_REFUSEE: true,
        RAPPEL: false,
      },
    },
  })
  getPreferences(@GetUser() currentUser: { id: string }) {
    return this.notificationService.getPreferencesForUser(currentUser.id);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: "Met à jour les préférences de notification de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences mises à jour',
    type: NotificationPreference,
    isArray: true,
  })
  updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @GetUser() currentUser: { id: string },
  ) {
    return this.notificationService.updatePreference(currentUser.id, dto);
  }
}
