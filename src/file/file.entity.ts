import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  original_name: string;

  @Column()
  stored_name: string;

  @Column()
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut })
  statut: Statut;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true, type: 'varchar' }) create_by: string;
  @Column({ nullable: true, type: 'varchar' }) updated_by: string;
}
