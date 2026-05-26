import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOffreDto {
  @IsString()
  @IsNotEmpty()
  uniqueId: string;

  @IsString()
  @IsOptional()
  descriptions?: string;
}

export class UpdateOffreDto extends PartialType(CreateOffreDto) {
  @IsString()
  @IsOptional()
  statut?: string;
}
