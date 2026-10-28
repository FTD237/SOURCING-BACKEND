import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import Company from '../company.entity';
import { User } from '../../user/user.entity';
import { LocalisationCompanyDto } from './localisation-company.dto';
import { Type } from 'class-transformer';
import { RecruitmentStatusEnum } from '../../common/enum/recruitment-status.enum';
import { PartialType } from '@nestjs/mapped-types';

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

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  logo_id?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  banner_id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company_description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contact_person: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  contact_phone: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isPartner: boolean;

  @ApiProperty()
  @IsEnum(RecruitmentStatusEnum)
  @IsNotEmpty()
  recruitment_status: RecruitmentStatusEnum;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CreateCompanyResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  company: Company;
}
