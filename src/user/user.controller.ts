import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserService } from './user.service';

import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Roles as RoleEnum } from '../common/enum/roles.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur créer avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Utilisateur existant' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user' })
  @ApiResponse({
    status: 200,
    description: 'Liste utilisateurs',
    type: [UserResponseDto],
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un utilisateur par son ID' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'utilisateur",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: "Mise à jour de l'utilisateur" })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Supprimer l'utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.userService.remove(id);
  }
}
