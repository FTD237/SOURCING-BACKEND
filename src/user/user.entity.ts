import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../role/role.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  id_role: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'id_role' })
  role: Role;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
