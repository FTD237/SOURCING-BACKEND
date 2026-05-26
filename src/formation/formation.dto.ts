import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFormationDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsNumber()
  @IsOptional()
  nbr_annee?: number;

  @IsString()
  @IsOptional()
  code?: string;
}

export class UpdateFormationDto extends PartialType(CreateFormationDto) {
  @IsString()
  @IsOptional()
  statut?: string;
}
