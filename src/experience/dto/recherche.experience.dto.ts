import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/pagination';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Statut } from '../../common/enum/statut.enum';

/** "true" / "false" en query string -> booléen (undefined si absent). */
const enBooleen = ({ value }: { value: unknown }): unknown => {
  switch (value) {
    case 'true':
    case true:
      return true;
    case 'false':
    case false:
      return false;
    default:
      return value;
  }
};

export class RechercheExperienceDTO extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Recherche libre : nom, prénom, intitule ou type (contient, sans casse)',
    example: 'bella',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: "intitule de l'expérience",
    example: "Développement d'une plateforme web",
  })
  @IsOptional()
  @IsString()
  intitule?: string;

  @ApiPropertyOptional({
    description: "Type de l'expérience",
    example: 'Stage Pro',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Date de début',
    example: new Date(),
  })
  @IsOptional()
  @IsDate()
  date_debut?: Date;

  @ApiPropertyOptional({
    enum: Statut,
    description:
      'Filtre exact sur le statut. Le statut SUPPRIME est réservé aux ' +
      'rôles ADMIN, MANAGER et SUPERADMIN.',
    example: Statut.ACTIF,
  })
  @IsOptional()
  @IsEnum(Statut)
  statut?: Statut;

  @ApiPropertyOptional({
    default: false,
    description:
      'Inclut les expériences supprimées. Réservé aux rôles ADMIN, MANAGER ' +
      'et SUPERADMIN (403 sinon).',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(enBooleen)
  @IsBoolean()
  inclureSupprimes?: boolean;
}
