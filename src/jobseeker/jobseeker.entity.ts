import { AuditableEntity } from '../entity/auditable.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Etudiant } from '../etudiant/etudiant.entity';

@Entity('jobseeker')
export class Jobseeker extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  studentId: string;

  @ApiProperty({ type: () => Etudiant })
  @OneToOne(() => Etudiant, (etudiant) => etudiant.is_job_seeker)
  @JoinColumn({ name: 'studentId' })
  etudiant: Etudiant;

  @ApiProperty({ example: 'MTN Cam' })
  @Column({ nullable: true, type: 'varchar' })
  entreprise: string | null;

  @ApiProperty({ example: "Directeur des Systèmes d'informations (DSI)" })
  @Column({ nullable: true, type: 'varchar' })
  poste: string | null;

  @ApiProperty({ type: 'boolean', example: true })
  @Column({ default: true })
  is_jobless: boolean;
}
