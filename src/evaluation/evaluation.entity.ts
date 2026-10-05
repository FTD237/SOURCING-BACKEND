import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AuditableEntity } from '../entity/auditable.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Experience } from '../experience/experience.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import Company from '../company/company.entity';

@Entity('evaluation')
@Unique('UQ_EVALUATION_EXPERIENCE', ['experience_id'])
@Check('CHK_EVALUATION_NOTE', '"note" BETWEEN 1 AND 5')
export class Evaluation extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  experience_id: string;

  @ApiProperty({ type: () => Experience })
  @OneToOne(() => Experience, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: Experience;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  student_id: string;

  @ApiProperty({ type: () => Etudiant })
  @ManyToOne(() => Etudiant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  etudiant: Etudiant;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  company_id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Column({ type: 'smallint' })
  note: number;

  @ApiProperty({ example: 'Très autonome et rigoureux.', required: false })
  @Column({ type: 'text', nullable: true })
  commentaire: string | null;
}
