import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkillService } from './skill.service';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
import { Skill } from './skill.entity';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('skills')
@ApiBearerAuth()
@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolesEnum.ETUDIANT, RolesEnum.MANAGER, RolesEnum.RH)
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau skill' })
  @ApiResponse({ status: HttpStatus.CREATED, type: Skill })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Skill déjà existant',
  })
  create(
    @Body() dto: CreateSkillDto,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.skillService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les skills' })
  @ApiResponse({ status: HttpStatus.OK, type: [Skill] })
  findAll() {
    return this.skillService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un skill par son id' })
  @ApiParam({ name: 'id', example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @ApiResponse({ status: HttpStatus.OK, type: Skill })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill introuvable',
  })
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un skill' })
  @ApiParam({ name: 'id', example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @ApiResponse({ status: HttpStatus.OK, type: Skill })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill introuvable',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.skillService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer (soft delete) un skill' })
  @ApiParam({ name: 'id', example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill introuvable',
  })
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.skillService.remove(id, currentUser);
  }
}
