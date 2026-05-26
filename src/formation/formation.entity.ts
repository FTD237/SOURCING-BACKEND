// ─── formation.entity.ts ─────────────────────────────────────────────────────
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('formation')
export class Formation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ nullable: true })
  nbr_annee: number;

  @Column({ nullable: true, unique: true })
  code: string;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
