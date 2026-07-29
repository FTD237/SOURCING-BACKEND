import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Company } from './company.entity';
import { User } from '../user/user.entity';

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

  // Information Company
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country_code: string;
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
}

export class CreateCompanyResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  company: Company;

  @ApiProperty()
  generatedPassword: string;
}
