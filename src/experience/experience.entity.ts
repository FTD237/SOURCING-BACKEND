import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('experience')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  student_id: string;

  @ManyToOne(() => Etudiant)
  @JoinColumn({ name: 'student_id' })
  etudiant: Etudiant;

  @Column()
  company_id: string;

  @Column()
  intitule: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  type: string;

  @Column({ type: 'date' })
  date_debut: Date;

  @Column({ type: 'date' })
  date_fin: Date;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut }) statut: Statut;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
