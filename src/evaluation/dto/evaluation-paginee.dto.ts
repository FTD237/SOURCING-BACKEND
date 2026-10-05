// evaluation/dto/evaluation-paginee.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Evaluation } from '../evaluation.entity';

class MetaPaginationDto {
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 10 }) limite: number;
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 5 }) totalPages: number;
  @ApiProperty({ example: true }) aSuivante: boolean;
  @ApiProperty({ example: false }) aPrecedente: boolean;
}

export class EvaluationPagineeDto {
  @ApiProperty({ type: () => [Evaluation] })
  donnees: Evaluation[];

  @ApiProperty({ type: () => MetaPaginationDto })
  meta: MetaPaginationDto;
}
