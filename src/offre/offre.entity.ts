// ─── offre.entity.ts ─────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Postuler } from '../postuler/postuler.entity';
import { AuditableEntity } from '../entity/auditable.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../company/company.entity';
import { Skill } from '../skills/skill.entity';
import { TypeOffre } from '../common/enum/type-offre.enum';

@Entity('offre')
export class Offre extends AuditableEntity {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Recherche stagiaire en génie logiciel',
  })
  @Column({ nullable: true, type: 'text' })
  descriptions: string;

  @ApiProperty({ type: () => Postuler })
  @OneToMany(() => Postuler, (postuler) => postuler.offre)
  candidatures: Offre[];

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  companyId: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.offres, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ApiProperty({ type: () => [Skill] })
  @ManyToMany(() => Skill, (skill) => skill.offres)
  @JoinTable({
    name: 'offre_skills',
    joinColumn: { name: 'offreId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skillId', referencedColumnName: 'id' },
  })
  skills: Skill[];

  @ApiProperty({ format: 'date-time' })
  @Column()
  dte_debut: Date;

  @ApiProperty({ format: 'date-time' })
  @Column()
  dte_fin: Date;

  @ApiProperty({
    enum: TypeOffre,
    enumName: 'TypeOffre',
    example: TypeOffre.STAGE_ACADEMIQUE,
  })
  @Column()
  type_offre: string;

  @ApiProperty({ example: 'Stage - chef projet' })
  @Column()
  titre: string;
}
