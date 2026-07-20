// src/etudiant/etudiant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('etudiant')
@Unique('UQ_ETUDIANT_MATRICULE', ['matricule'])
export class Etudiant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.etudiant)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  promotionId: string;

  @Column()
  matricule: string;

  @Column()
  annee_acad: string;

  @Column({ default: false })
  is_job_seeker: boolean;

  @Column({ nullable: true, type: 'float', default: 0 })
  star_rate: number;

  @CreateDateColumn()
  dte_creation: Date;

  @UpdateDateColumn()
  dte_modif: Date;

  @Column({ default: Statut.ACTIF })
  statut: Statut;

  @Column({ nullable: true })
  dte_suppression: Date;

  @Column({ nullable: true, type: 'varchar' })
  create_by: string;

  @Column({ nullable: true, type: 'varchar' })
  updated_by: string;
}
