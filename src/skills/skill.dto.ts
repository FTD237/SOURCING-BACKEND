// ─── skill.dto.ts ────────────────────────────────────────────────────────────
import { IsNotEmpty, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  nom: string;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
