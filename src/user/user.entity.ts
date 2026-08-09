// src/user/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
  BeforeInsert,
  Unique,
  OneToOne,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Role } from '../entity/role.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Company } from '../company/company.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('user')
@Unique('UQ_USERS_EMAIL', ['email'])
export class User {
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

  @ApiProperty({ example: 'Fils' })
  @Column()
  nom: string;

  @ApiProperty({ example: 'Logan' })
  @Column()
  prenom: string;

  @ApiProperty({ example: 'logan@example.com' })
  @Column()
  email: string;

  // Jamais exposé : ni dans la doc Swagger (@ApiHideProperty), ni dans le
  // JSON réel si ClassSerializerInterceptor est actif (@Exclude).
  @ApiHideProperty()
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ type: () => Etudiant, required: false })
  @OneToOne(() => Etudiant, (etudiant) => etudiant.user)
  etudiant: Etudiant;

  @ApiProperty({ type: () => Company, required: false })
  @OneToOne(() => Company, (company) => company.user)
  company: Company;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

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

  // Jamais exposés : tokens de réinitialisation de mot de passe.
  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true, type: 'varchar' })
  resetPasswordToken: string | null;

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date | null;
}
