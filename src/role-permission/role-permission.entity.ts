import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';

@Entity('role_permission')
export class RolePermission {
  @PrimaryColumn({ type: 'uuid' })
  id_role: string;

  @PrimaryColumn({ type: 'uuid' })
  id_permission: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_role' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_permission' })
  permission: Permission;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ nullable: true }) statut: string;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ type: 'uuid', nullable: true }) create_by: string;
  @Column({ type: 'uuid', nullable: true }) updated_by: string;
}
