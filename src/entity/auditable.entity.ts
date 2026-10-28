import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Statut } from '../common/enum/statut.enum';

/**
 * Colonnes d'audit communes aux entités métier : horodatage, statut et
 * suivi des auteurs. Les entités concernées l'étendent au lieu de
 * redéclarer ces six champs à l'identique.
 *
 * Les noms de colonnes correspondent aux noms de propriétés (comportement
 * TypeORM par défaut), afin de rester iso-schéma avec l'existant.
 */
export abstract class AuditableEntity {
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn()
  dte_creation: Date;

  @ApiProperty({ format: 'date-time' })
  @UpdateDateColumn()
  dte_modif: Date;

  @ApiProperty({ enum: Statut, enumName: 'Statut', example: Statut.ACTIF })
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut })
  statut: Statut;

  @ApiPropertyOptional({
    description: 'Date de suppression logique (soft delete)',
    format: 'date-time',
  })
  @Column({ nullable: true })
  dte_suppression: Date;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur ayant créé l'enregistrement",
  })
  @Column({ nullable: true, type: 'varchar' })
  create_by: string;

  @ApiPropertyOptional({
    description:
      "Identifiant de l'utilisateur ayant modifié l'enregistrement en dernier",
  })
  @Column({ nullable: true, type: 'varchar' })
  updated_by: string;
}
