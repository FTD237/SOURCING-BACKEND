import { IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../common/enum/notification-type.enum';

export class UpdatePreferenceItemDto {
  @ApiProperty({
    enum: NotificationType,
    description: 'Type de notification concerné par cette préférence',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Active ou désactive ce type de notification',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({
    type: [UpdatePreferenceItemDto],
    description: 'Liste des préférences à mettre à jour',
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatePreferenceItemDto)
  preferences: UpdatePreferenceItemDto[];
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titre: string;
  message: string;
  data?: Record<string, unknown>;
}
