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
import { Role } from '../entity/role.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Company } from '../company/company.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('user')
@Unique('UQ_USERS_EMAIL', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  id_role: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'id_role' })
  role: Role;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  email: string;

  @Column()
  password: string;

  // Relation One-to-One avec Etudiant
  @OneToOne(() => Etudiant, (etudiant) => etudiant.user)
  etudiant: Etudiant;

  @OneToOne(() => Company, (company) => company.user)
  company: Company;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @CreateDateColumn()
  dte_creation: Date;

  @UpdateDateColumn()
  dte_modif: Date;

  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut })
  statut: Statut;

  @Column({ nullable: true })
  dte_suppression: Date;

  @Column({ nullable: true, type: 'varchar' })
  create_by: string;

  @Column({ nullable: true, type: 'varchar' })
  updated_by: string;
}
