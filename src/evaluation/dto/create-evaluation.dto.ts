import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  experience_id: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10)
  note: number;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}
