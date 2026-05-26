// ─── experience.dto.ts ───────────────────────────────────────────────────────
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateExperienceDto {
  @IsNumber()
  student_id: number;

  @IsNumber()
  @IsOptional()
  company_id?: number;

  @IsNumber()
  @IsOptional()
  rh_id?: number;

  @IsString()
  @IsNotEmpty()
  intitule: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @IsDateString()
  @IsOptional()
  date_fin?: string;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
