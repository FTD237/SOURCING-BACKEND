// ─── skill.dto.ts ────────────────────────────────────────────────────────────
import { IsNotEmpty, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ description: 'Nom du skill' })
  @IsString()
  @IsNotEmpty()
  nom: string;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
