import { SetMetadata } from '@nestjs/common';
import { Roles as RolesEnum } from '../common/enum/roles.enum'; // adapte le chemin

export const ROLES_KEY = 'role';
export const Roles = (...role: RolesEnum[]) => SetMetadata(ROLES_KEY, role);
