// ─── skill.dto.ts ────────────────────────────────────────────────────────────
import { IsNotEmpty, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  nom: string;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

// ─── skill.service.ts ────────────────────────────────────────────────────────
// import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Skill } from './skill.entity';
// import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
//
// @Injectable()
// export class SkillService {
//   constructor(@InjectRepository(Skill) private skillRepo: Repository<Skill>) {}
//   async create(dto: CreateSkillDto) { ... }
//   async findAll() { return this.skillRepo.find(); }
//   async findOne(id: number) { ... }
//   async update(id: number, dto: UpdateSkillDto) { ... }
//   async remove(id: number) { ... }
// }
