import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('role-permission')
export class RolePermissionController {
  constructor(private readonly rpService: RolePermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Association role permission' })
  @ApiResponse({
    status: 201,
    description: 'Association role permission faite',
  })
  @ApiResponse({ status: 400, description: 'Association déjà existante' })
  async create(@Body() dto: CreateRolePermissionDto) {
    return this.rpService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les roles permissions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des roles permissions',
  })
  async findAll() {
    return this.rpService.findAll();
  }

  @Get('role/:id_role')
  @ApiOperation({ summary: 'Permission associer à un rôle' })
  @ApiResponse({
    status: 200,
    description: "Permissions d'un rôle",
  })
  async findByPermission(@Param('id_permission') id_permission: string) {
    return this.rpService.findByPermission(id_permission);
  }

  @Delete(':id_role/:id_permission')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une permission à un role' })
  @ApiResponse({
    status: 200,
    description: 'Permission retirée',
  })
  async remove(
    @Param('id_permission') id_permission: string,
    @Param('id_role') id_role: string,
  ) {
    return this.rpService.remove({ id_role, id_permission });
  }
}
