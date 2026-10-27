import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendActivationDto {
  @ApiProperty({ example: 'marie.bella@etud.cm' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
