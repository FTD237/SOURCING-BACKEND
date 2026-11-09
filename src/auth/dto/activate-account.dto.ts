import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({
    description: "Token reçu dans le lien d'activation envoyé par mail",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    minLength: 8,
    description: "Mot de passe choisi par l'utilisateur (8 à 72 caractères)",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
