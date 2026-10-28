import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty()
  @IsUUID()
  experience_id: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(10)
  note: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}
