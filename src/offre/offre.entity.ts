// ─── offre.entity.ts ─────────────────────────────────────────────────────────
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('offre')
export class Offre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uniqueId: string;

  @Column({ nullable: true, type: 'text' })
  descriptions: string;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true }) create_by: number;
  @Column({ nullable: true }) updated_by: number;
}
