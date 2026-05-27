import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'delete',
    description: 'Statut user',
  })
  @IsString()
  @IsOptional()
  statut?: string;
}
