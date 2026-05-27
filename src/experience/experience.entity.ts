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

@Entity('experience')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @ManyToOne(() => Etudiant)
  @JoinColumn({ name: 'student_id' })
  etudiant: Etudiant;

  @Column({ nullable: true })
  company_id: number;

  @Column({ nullable: true })
  rh_id: number;

  @Column()
  intitule: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true, type: 'date' })
  date_debut: Date;

  @Column({ nullable: true, type: 'date' })
  date_fin: Date;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
