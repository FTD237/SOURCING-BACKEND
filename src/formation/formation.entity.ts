// src/formation/formation.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('formation')
@Unique('UQ_FORMATION_NOM', ['nom'])
export class Formation extends AuditableEntity {
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
}
