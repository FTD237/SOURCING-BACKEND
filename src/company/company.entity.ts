import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Country } from '../entity/country.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @OneToOne(() => User, (user: User) => user.company)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  country_code: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_code' })
  country: Country;

  @CreateDateColumn() dte_creation: Date;
  @UpdateDateColumn() dte_modif: Date;
  @Column({ default: Statut.ACTIF, type: 'enum', enum: Statut }) statut: Statut;
  @Column({ nullable: true }) dte_suppression: Date;
  @Column({ nullable: true, type: 'varchar' }) create_by: string;
  @Column({ nullable: true, type: 'varchar' }) updated_by: string;
}
