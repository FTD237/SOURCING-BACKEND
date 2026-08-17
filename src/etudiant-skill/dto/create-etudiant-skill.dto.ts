// dto/create-etudiant-skill.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { NiveauCompetence } from '../../common/enum/niveau-competence.enum';

export class CreateEtudiantSkillDto {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @IsUUID()
  etudiantId: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @IsUUID()
  skillId: string;

  @ApiProperty({
    example: NiveauCompetence.INTERMEDIAIRE,
    enum: NiveauCompetence,
  })
  @IsEnum(NiveauCompetence)
  level: NiveauCompetence;
}
