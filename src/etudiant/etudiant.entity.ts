import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('etudiant')
export class Etudiant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  promotionId: number;

  @Column({ unique: true })
  matricule: string;

  @Column({ nullable: true })
  annee_acad: string;

  @Column({ default: false })
  is_job_seeker: boolean;

  @Column({ nullable: true, type: 'float' })
  star_rate: number;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
