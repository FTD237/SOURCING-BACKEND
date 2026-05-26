import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { DeleteRolePermissionDto } from './dto/delete-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly roleRepository: Repository<RolePermission>,
  ) {}

  async create(dto: CreateRolePermissionDto): Promise<RolePermission> {
    const exists = await this.roleRepository.findOne({
      where: { id_role: dto.id_role, id_permission: dto.id_permission },
    });
    if (exists)
      throw new ConflictException(
        'Cette permission est déjà assignée à ce rôle',
      );

    const rp = this.roleRepository.create(dto);
    return this.roleRepository.save(rp);
  }

  async findByRole(id_role: string): Promise<RolePermission[]> {
    return this.roleRepository.find({
      where: { id_role },
      relations: { permission: true },
    });
  }

  async findByPermission(id_permission: string): Promise<RolePermission[]> {
    return this.roleRepository.find({
      where: { id_permission },
      relations: { role: true, permission: true },
    });
  }

  async findAll(): Promise<RolePermission[]> {
    return this.roleRepository.find({
      relations: { role: true, permission: true },
    });
  }

  async remove(dto: DeleteRolePermissionDto): Promise<void> {
    const rp = await this.roleRepository.findOne({
      where: { id_role: dto.id_role, id_permission: dto.id_permission },
    });
    if (!rp)
      throw new NotFoundException('Association rôle-permission introuvable');

    await this.roleRepository.remove(rp);
  }
}
