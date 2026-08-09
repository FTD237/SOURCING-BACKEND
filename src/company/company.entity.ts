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
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { Country } from '../entity/country.entity';
import { Statut } from '../common/enum/statut.enum';

@Entity('company')
export class Company {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  user_id: string;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user: User) => user.company)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'CM' })
  @Column()
  country_code: string;

  @ApiProperty({ type: () => Country })
  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_code' })
  country: Country;

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
}
