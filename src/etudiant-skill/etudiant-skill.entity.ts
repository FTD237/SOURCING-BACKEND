import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AuditableEntity } from '../entity/auditable.entity';
import { ApiProperty } from '@nestjs/swagger';
import { NiveauCompetence } from '../common/enum/niveau-competence.enum';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Skill } from '../skills/skill.entity';

@Entity('etudiant_skills')
export class EtudiantSkill extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryColumn()
  etudiantId: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryColumn()
  skillId: string;

  @ApiProperty({
    example: NiveauCompetence.INTERMEDIAIRE,
    enum: NiveauCompetence,
  })
  @Column({ type: 'enum', enum: NiveauCompetence })
  level: NiveauCompetence;

  @ApiProperty({ type: () => Etudiant })
  @ManyToOne(() => Etudiant, (etudiant) => etudiant.etudiantSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'etudiantId' })
  etudiant: Etudiant;

  @ApiProperty({ type: () => Skill })
  @ManyToOne(() => Skill, (skill) => skill.etudiantSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;
}
