import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('etudiant')
@Unique('UQ_ETUDIANT_MATRICULE', ['matricule'])
export class Etudiant extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  userId: string;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.etudiant)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  promotionId: string;

  @ApiProperty({ example: 'UI2027' })
  @Column()
  matricule: string;

  @ApiProperty({ example: '2025-2026' })
  @Column()
  annee_acad: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  is_job_seeker: boolean;

  @ApiProperty({ example: 0, required: false })
  @Column({ nullable: true, type: 'float', default: 0 })
  star_rate: number;

  @ApiProperty()
  @CreateDateColumn()
  dte_creation: Date;

  @ApiProperty()
  @UpdateDateColumn()
  dte_modif: Date;

  @ApiProperty({ enum: Statut, example: Statut.ACTIF })
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut })
  statut: Statut;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  dte_suppression: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true, type: 'varchar' })
  create_by: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true, type: 'varchar' })
  updated_by: string;
}
