// dto/update-etudiant-skill.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { NiveauCompetence } from '../../common/enum/niveau-competence.enum';

export class UpdateEtudiantSkillDto {
  @ApiProperty({ example: NiveauCompetence.AVANCE, enum: NiveauCompetence })
  @IsEnum(NiveauCompetence)
  level: NiveauCompetence;
}
