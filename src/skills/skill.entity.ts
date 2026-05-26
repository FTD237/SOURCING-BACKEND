// ─── skill.entity.ts ─────────────────────────────────────────────────────────
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom: string;
}
