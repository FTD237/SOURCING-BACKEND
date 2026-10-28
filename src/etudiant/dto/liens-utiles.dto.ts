import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsValidUrl } from '../../common/validators/is-valid-url.validator';

/**
 * Tous les liens sont optionnels : on ne valide que ceux qui sont envoyés.
 * (@IsOptional ignore la validation quand la valeur est undefined ou null.)
 */
export class LiensUtilesDto {
  @ApiPropertyOptional({ example: 'https://github.com' })
  @IsOptional()
  @IsValidUrl()
  github?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com' })
  @IsOptional()
  @IsValidUrl()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://mon-portfolio.com' })
  @IsOptional()
  @IsValidUrl()
  portfolio?: string;
}
