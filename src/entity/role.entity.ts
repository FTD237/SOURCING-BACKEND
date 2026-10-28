import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '../common/enum/roles.enum';
import { BaseEntity } from './base.entity';

@Entity('role')
export class Role extends BaseEntity {
  @ApiProperty({
    enum: Roles,
    enumName: 'Roles',
    description: 'Nom du rôle',
    example: Roles.ETUDIANT,
  })
  @Column({
    type: 'enum',
    enum: Roles,
  })
  nom: Roles;
}
