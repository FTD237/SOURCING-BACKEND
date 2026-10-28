import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../common/enum/notification-type.enum';
import { AuditableEntity } from '../../entity/auditable.entity';
import { User } from '../../user/user.entity';

@Entity('notification')
export class Notification extends AuditableEntity {
  @ApiProperty({ description: 'Identifiant unique de la notification' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: "Identifiant de l'utilisateur destinataire" })
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ enum: NotificationType, description: 'Type de notification' })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Titre court affiché à l’utilisateur' })
  @Column()
  titre: string;

  @ApiProperty({ description: 'Contenu détaillé de la notification' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'Données contextuelles additionnelles (payload libre)',
    required: false,
    nullable: true,
    type: Object,
    additionalProperties: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty({ description: 'Indique si la notification a été lue' })
  @Column({ default: false })
  lu: boolean;

  @ApiProperty({
    description: 'Date à laquelle la notification a été lue',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  dateLecture: Date | null;
}
