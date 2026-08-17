// etudiant-skill.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EtudiantSkill } from './etudiant-skill.entity';
import { EtudiantSkillService } from './etudiant-skill.service';
import { EtudiantSkillController } from './etudiant-skill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EtudiantSkill])],
  controllers: [EtudiantSkillController],
  providers: [EtudiantSkillService],
  exports: [EtudiantSkillService],
})
export class EtudiantSkillModule {}
