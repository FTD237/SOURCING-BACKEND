// ─── formation.entity.ts ─────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { Statut } from '../common/enum/statut.enum';

@Entity('formation')
@Unique('UQ_FORMATION_NOM', ['nom'])
export class Formation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @IsString()
  @Column()
  nom: string;

  @IsNotEmpty()
  @Column()
  nbr_annee: number;

  @Column({ unique: true })
  code: string;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ default: Statut.ACTIF }) statut: Statut;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
