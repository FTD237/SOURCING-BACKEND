import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { Country } from '../entity/country.entity';
import { AuditableEntity } from '../entity/auditable.entity';
import { Offre } from '../offre/offre.entity';
import type { LocalisationCompany } from '../common/types/localisation-company';
import { NiveauEtudeEnum } from '../common/enum/niveau-etude.enum';
import { RecruitmentStatusEnum } from '../common/enum/recruitment-status.enum';
import { FileEntity } from '../file/file.entity';

@Entity('company')
class Company extends AuditableEntity {
  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column({ type: 'uuid' })
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

  @ApiProperty({ type: () => [Offre] })
  @OneToMany(() => Offre, (offre) => offre.company)
  offres: Offre[];

  @ApiProperty({
    example: {
      latitude: 3.848032,
      longitude: 11.502075,
      nom: 'MTN cam',
      city: 'Douala',
      address: 'Douala 34 rue de la joie',
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  localisation: LocalisationCompany;

  @ApiProperty({ example: 'MTN cam' })
  @Column()
  company_name: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column({ type: 'uuid', nullable: true })
  logo_id: string | null;

  @ApiProperty({ type: () => FileEntity })
  @OneToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'logo_id' })
  logo: FileEntity | null;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @Column({ type: 'uuid', nullable: true })
  banner_id: string | null;

  @ApiProperty({ type: () => FileEntity })
  @OneToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'banner_id' })
  banner: FileEntity | null;

  @ApiProperty({ example: 'Entreprise de réseau et télécom' })
  @Column()
  company_description: string;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  contact_person: string;

  @ApiProperty({ example: 658134523 })
  @Column()
  contact_phone: number;

  @ApiProperty({ type: 'boolean', example: true, default: false })
  @Column({ default: false })
  isPartner: boolean;

  @ApiProperty({
    enum: RecruitmentStatusEnum,
    enumName: 'RecruitmentStatusEnum',
    example: RecruitmentStatusEnum.CLOSED,
  })
  @Column({
    enum: RecruitmentStatusEnum,
    enumName: 'RecruitmentStatusEnum',
    type: 'enum',
  })
  recruitment_status: RecruitmentStatusEnum;

  @ApiProperty({
    enum: NiveauEtudeEnum,
    enumName: 'NiveauEtudeEnum',
    example: NiveauEtudeEnum.FIRST_YEAR,
  })
  @Column({
    enum: NiveauEtudeEnum,
    enumName: 'NiveauEtudeEnum',
    type: 'enum',
  })
  minStudentLevel: NiveauEtudeEnum;
}

export default Company;
