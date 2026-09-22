import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdatePreferencesDto } from './notification.dto';
import { PaginationDto } from '../common/pagination';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @GetUser() currentUser: { id: string },
  ) {
    return this.notificationService.findAllForUser(currentUser.id, pagination);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @GetUser() currentUser: { id: string }) {
    return this.notificationService.markAsRead(id, currentUser.id);
  }

  @Patch('read-all')
  markAllAsRead(@GetUser() currentUser: { id: string }) {
    return this.notificationService.markAllAsRead(currentUser.id);
  }

  @Get('preferences')
  getPreferences(@GetUser() currentUser: { id: string }) {
    return this.notificationService.getPreferencesForUser(currentUser.id);
  }

  @Patch('preferences')
  updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @GetUser() currentUser: { id: string },
  ) {
    return this.notificationService.updatePreference(currentUser.id, dto);
  }
}
