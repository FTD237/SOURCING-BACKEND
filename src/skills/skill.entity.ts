import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '../entity/auditable.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EtudiantSkill } from '../etudiant-skill/etudiant-skill.entity';

@Entity('skills')
@Unique('UQ_SKILL_NAME', ['nom'])
export class Skill extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'react' })
  @Column()
  nom: string;

  @ApiProperty({ type: () => [EtudiantSkill] })
  @OneToMany(() => EtudiantSkill, (etudiantSkill) => etudiantSkill.skill)
  etudiantSkills: EtudiantSkill[];
}
