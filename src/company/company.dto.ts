import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Company } from './company.entity';
import { User } from '../user/user.entity';
import type { LocalisationCompany } from '../common/types/localisation-company';

export class CreateCompanyDto {
  // Informations User
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  localisation?: LocalisationCompany;
}

export class UpdateCompanyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country_code?: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  localisation?: LocalisationCompany;
}

export class CreateCompanyResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  company: Company;
}
