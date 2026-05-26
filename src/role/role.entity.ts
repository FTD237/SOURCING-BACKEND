import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;

  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
