import { ApiProperty } from '@nestjs/swagger';
import { StatutCandidature } from '../../common/enum/statut-candidature.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdatePostulerStatutDto {
  @ApiProperty({
    description: 'Nouveau statut de la candidature',
    enum: StatutCandidature,
    enumName: 'StatutCandidature',
    example: StatutCandidature.ACCEPTEE,
  })
  @IsNotEmpty()
  @IsEnum(StatutCandidature)
  statut: StatutCandidature;
}
