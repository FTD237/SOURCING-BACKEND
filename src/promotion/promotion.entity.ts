import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Formation } from '../formation/formation.entity';
import { AuditableEntity } from '../entity/auditable.entity';

@Entity('promotion')
export class Promotion extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  id_formation: string;

  @ManyToOne(() => Formation)
  @JoinColumn({ name: 'id_formation' })
  formation: Formation;

  @Column()
  annee: string;
}
