import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { Country } from '../entity/country.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('company')
export class Company extends AuditableEntity {
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
}
