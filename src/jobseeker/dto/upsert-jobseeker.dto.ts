import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertJobseekerDto {
  @ApiPropertyOptional({ example: 'MTN Cam' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  entreprise?: string;

  @ApiPropertyOptional({
    example: "Directeur des Systèmes d'informations (DSI)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  poste?: string;

  @ApiPropertyOptional({ example: true, description: 'Par défaut: true' })
  @IsOptional()
  @IsBoolean()
  is_jobless?: boolean;
}
