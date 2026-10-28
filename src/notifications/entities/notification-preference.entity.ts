import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { NotificationType } from '../../common/enum/notification-type.enum';

@Entity('notification_preference')
@Unique(['userId', 'type'])
export class NotificationPreference {
  @ApiProperty({ description: 'Identifiant unique de la préférence' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Identifiant de l’utilisateur concerné' })
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type de notification concerné',
  })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Indique si ce type de notification est activé' })
  @Column({ default: true })
  active: boolean;
}
