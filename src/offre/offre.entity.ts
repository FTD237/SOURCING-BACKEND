// ─── offre.entity.ts ─────────────────────────────────────────────────────────
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Postuler } from '../postuler/postuler.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('offre')
export class Offre extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'text' })
  descriptions: string;

  @OneToMany(() => Postuler, (postuler) => postuler.offre)
  candidatures: Offre[];
}
