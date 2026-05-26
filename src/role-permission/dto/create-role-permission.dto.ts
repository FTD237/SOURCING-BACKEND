import { IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @IsUUID()
  id_role: string;

  @IsUUID()
  id_permission: string;
}
