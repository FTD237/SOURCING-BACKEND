// src/user/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  BeforeInsert,
  Unique,
  OneToOne,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../entity/role.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Company } from '../company/company.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('user')
@Unique('UQ_USERS_EMAIL', ['email'])
export class User extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  id_role: string;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'id_role' })
  role: Role;

  @ApiProperty({ example: 'Dupont' })
  @Column()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @Column()
  prenom: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  @Column()
  email: string;

  @Column()
  password: string;

  // Relation One-to-One avec Etudiant
  @ApiPropertyOptional({ type: () => Etudiant })
  @OneToOne(() => Etudiant, (etudiant) => etudiant.user)
  etudiant: Etudiant;

  @ApiPropertyOptional({ type: () => Company })
  @OneToOne(() => Company, (company) => company.user)
  company: Company;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @Column({ nullable: true, type: 'varchar' })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date | null;
}
