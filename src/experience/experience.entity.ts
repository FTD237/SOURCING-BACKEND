import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Etudiant } from '../etudiant/etudiant.entity';
import { AuditableEntity } from '../entity/auditable.entity';
import { Company } from '../company/company.entity';

@Entity('experience')
export class Experience extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  student_id: string;

  @ApiProperty({ type: () => Etudiant })
  @ManyToOne(() => Etudiant)
  @JoinColumn({ name: 'student_id' })
  etudiant: Etudiant;

  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    required: false,
  })
  @Column({ nullable: true })
  company_id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @ApiProperty({ example: "Développement d'une plateforme web de E-learning" })
  @Column()
  intitule: string;

  @ApiProperty({ example: 'Stage de 5eme année au cours duquel...' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'Stage académique', required: false })
  @Column({ nullable: true })
  type: string;

  @ApiProperty({ example: '2025-11-17' })
  @Column({ type: 'date' })
  date_debut: Date;

  @ApiProperty({ example: '2026-04-17' })
  @Column({ type: 'date' })
  date_fin: Date;
}
