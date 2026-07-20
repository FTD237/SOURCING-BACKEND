import { IsUUID, MaxLength, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromotionCreateDto {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: 'ID de la formation associée',
  })
  @IsUUID()
  id_formation: string;

  @ApiProperty({
    example: '2027',
    description: 'Annee de fin de la promotion',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  annee: string;
}
