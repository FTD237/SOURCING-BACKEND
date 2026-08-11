import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Colonnes communes à toutes les entités métier. */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  dte_creation: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ format: 'date-time' })
  dte_modif: Date;
}
