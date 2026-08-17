// ─── offre.entity.ts ─────────────────────────────────────────────────────────
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Postuler } from '../postuler/postuler.entity';
import { AuditableEntity } from '../entity/auditable.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('offre')
export class Offre extends AuditableEntity {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Recherche stagiaire en génie logiciel',
  })
  @Column({ nullable: true, type: 'text' })
  descriptions: string;

  @ApiProperty({ type: () => Postuler })
  @OneToMany(() => Postuler, (postuler) => postuler.offre)
  candidatures: Offre[];
}
