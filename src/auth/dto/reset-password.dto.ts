import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token reçu par email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NouveauPassword123!',
    description: 'Nouveau mot de passe',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
