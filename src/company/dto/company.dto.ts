import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Company } from '../company.entity';
import { User } from '../../user/user.entity';
import { LocalisationCompanyDto } from './localisation-company.dto';
import { Type } from 'class-transformer';

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

  @ApiProperty({ type: () => LocalisationCompanyDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalisationCompanyDto)
  localisation?: LocalisationCompanyDto;
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

  @ApiProperty({ type: () => LocalisationCompanyDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalisationCompanyDto)
  localisation?: LocalisationCompanyDto;
}

export class CreateCompanyResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  company: Company;
}
