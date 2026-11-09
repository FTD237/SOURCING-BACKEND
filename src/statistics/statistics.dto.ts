import { ApiProperty } from '@nestjs/swagger';

export class StatisticsDto {
  @ApiProperty({
    example: 128,
    description: 'Nombre de candidatures (hors supprimées)',
  })
  candidatures: number;

  @ApiProperty({
    example: 52,
    description: "Nombre d'offres actives",
  })
  offresActives: number;

  @ApiProperty({
    example: 128,
    description: "Nombre d'étudiants (hors supprimés)",
  })
  etudiants: number;

  @ApiProperty({
    example: 128,
    description: "Nombres d'entreprises (hors supprimées)",
  })
  entreprises: number;
}
