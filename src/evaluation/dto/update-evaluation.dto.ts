// evaluation/dto/update-evaluation.dto.ts
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEvaluationDto } from './create-evaluation.dto';

export class UpdateEvaluationDto extends PartialType(
  OmitType(CreateEvaluationDto, ['experience_id'] as const),
) {}
