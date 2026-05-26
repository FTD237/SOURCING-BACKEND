import { IsUUID } from 'class-validator';

export class DeleteRolePermissionDto {
  @IsUUID()
  id_role: string;

  @IsUUID()
  id_permission: string;
}
