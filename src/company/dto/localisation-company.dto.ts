// localisation-company.dto.ts
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocalisationCompanyDto {
  @ApiProperty({ example: 3.848032 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 11.502075 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'MTN cam' })
  @IsString()
  nom: string;
}
