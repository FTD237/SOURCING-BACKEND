// src/formation/formation.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Statut } from '../common/enum/statut.enum';

@Entity('formation')
@Unique('UQ_FORMATION_NOM', ['nom'])
export class Formation {
  @ApiProperty({
    description: 'Identifiant UUID de la formation',
    example: '3c5a02fe-6f19-47ed-abc2-fd6a31193f64',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom de la formation (unique)',
    example: 'Développement Full Stack',
  })
  @IsNotEmpty()
  @IsString()
  @Column()
  nom: string;

  @ApiProperty({
    description: "Durée de la formation en nombre d'années",
    example: 3,
  })
  @IsNotEmpty()
  @Column()
  nbr_annee: number;

  @ApiProperty({
    description: 'Code interne unique de la formation',
    example: 'DEV-FS-01',
  })
  @Column({ unique: true })
  code: string;

  @ApiProperty({
    description: 'Date de création de la formation',
    example: '2026-06-23T11:02:15.803Z',
  })
  @CreateDateColumn()
  dte_creation: Date;

  @ApiProperty({
    description: 'Date de dernière modification de la formation',
    example: '2026-06-23T11:02:15.803Z',
  })
  @UpdateDateColumn()
  dte_modif: Date;

  @ApiProperty({
    description: 'Statut de la formation',
    enum: Statut,
    enumName: 'Statut',
    example: Statut.ACTIF,
  })
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut })
  statut: Statut;

  @ApiPropertyOptional({
    description:
      'Date de suppression logique (renseignée uniquement après un soft delete)',
    example: null,
  })
  @Column({ nullable: true })
  dte_suppression: Date;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur ayant créé la formation",
    example: '3c5a02fe-6f19-47ed-abc2-fd6a31193f64',
  })
  @Column({ nullable: true })
  create_by: string;

  @ApiPropertyOptional({
    description:
      "Identifiant de l'utilisateur ayant modifié la formation en dernier",
    example: '3c5a02fe-6f19-47ed-abc2-fd6a31193f64',
  })
  @Column({ nullable: true })
  updated_by: string;
}
