import { IsOptional, IsString } from 'class-validator';

export class UpdateRolePermissionDto {
  @IsString()
  @IsOptional()
  statut?: string;
}
