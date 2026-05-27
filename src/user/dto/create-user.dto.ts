import {
  IsUUID,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: 'ID du role du user',
  })
  @IsUUID()
  id_role: string;

  @ApiProperty({
    example: 'jean',
    description: 'Nom du user',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    example: 'berger',
    description: 'Prenom du user',
  })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Adresse email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mot de passe',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
