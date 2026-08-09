import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('file')
export class FileEntity extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column()
  user_id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'cv.pdf' })
  @Column()
  original_name: string;

  @ApiProperty({ example: 'efbfba79-4c0c-4be8-83e0-c06f59cef8cb.pdf' })
  @Column()
  stored_name: string;

  @ApiProperty({ example: 'application/pdf' })
  @Column()
  mimetype: string;

  @ApiProperty({ example: 25600 })
  @Column({ type: 'int' })
  size: number;
}
