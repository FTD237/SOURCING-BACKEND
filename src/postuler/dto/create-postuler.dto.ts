import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePostulerDto {
  @ApiProperty({
    description: "Identifiant de l'offre à laquelle l'étudiant postule",
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
  })
  @IsNotEmpty()
  @IsUUID()
  offreId: string;

  @ApiProperty({
    description: "Identifiant UUID de l'étudiant qui postule",
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
  })
  @IsNotEmpty()
  @IsUUID()
  etudiantId: string;
}
