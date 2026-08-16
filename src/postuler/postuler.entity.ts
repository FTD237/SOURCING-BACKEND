// src/postuler/postuler.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Offre } from '../offre/offre.entity';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('postuler')
@Unique('UQ_POSTULER_OFFRE_ETUDIANT', ['offreId', 'etudiantId'])
export class Postuler extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  offreId: string;

  @ApiProperty({ type: () => Offre })
  @ManyToOne(() => Offre, (offre) => offre.candidatures)
  @JoinColumn({ name: 'offreId' })
  offre: Offre;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  etudiantId: string;

  @ApiProperty({ type: () => Etudiant })
  @ManyToOne(() => Etudiant, (etudiant) => etudiant.candidatures)
  @JoinColumn({ name: 'etudiantId' })
  etudiant: Etudiant;

  @ApiProperty({ example: '2026-08-16T10:30:00.000Z' })
  @CreateDateColumn()
  date_candidature: Date;

  @ApiProperty({
    enum: StatutCandidature,
    enumName: 'StatutCandidature',
    example: StatutCandidature.EN_ATTENTE,
  })
  @Column({
    type: 'enum',
    enum: StatutCandidature,
    default: StatutCandidature.EN_ATTENTE,
  })
  statut_candidature: StatutCandidature;
}
