// etudiant-skill.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EtudiantSkillService } from './etudiant-skill.service';
import { CreateEtudiantSkillDto } from './dto/create-etudiant-skill.dto';
import { UpdateEtudiantSkillDto } from './dto/update-etudiant-skill.dto';
import { EtudiantSkill } from './etudiant-skill.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('etudiant-skills')
@Controller('etudiant-skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolesEnum.ETUDIANT, RolesEnum.RH, RolesEnum.MANAGER)
export class EtudiantSkillController {
  constructor(private readonly etudiantSkillService: EtudiantSkillService) {}

  @Post()
  @ApiOperation({ summary: 'Associer un skill à un étudiant' })
  @ApiResponse({ status: 201, type: EtudiantSkill })
  create(
    @Body() dto: CreateEtudiantSkillDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<EtudiantSkill> {
    return this.etudiantSkillService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les associations étudiant-skill' })
  @ApiResponse({ status: 200, type: [EtudiantSkill] })
  findAll(): Promise<EtudiantSkill[]> {
    return this.etudiantSkillService.findAll();
  }

  @Get('etudiant/:etudiantId')
  @ApiOperation({ summary: "Lister les skills d'un étudiant" })
  @ApiResponse({ status: 200, type: [EtudiantSkill] })
  findAllByEtudiant(
    @Param('etudiantId') etudiantId: string,
  ): Promise<EtudiantSkill[]> {
    return this.etudiantSkillService.findAllByEtudiant(etudiantId);
  }

  @Get(':etudiantId/:skillId')
  @ApiOperation({ summary: 'Récupérer une association précise' })
  @ApiResponse({ status: 200, type: EtudiantSkill })
  findOne(
    @Param('etudiantId') etudiantId: string,
    @Param('skillId') skillId: string,
  ): Promise<EtudiantSkill> {
    return this.etudiantSkillService.findOne(etudiantId, skillId);
  }

  @Patch(':etudiantId/:skillId')
  @ApiOperation({ summary: "Mettre à jour le niveau d'un skill" })
  @ApiResponse({ status: 200, type: EtudiantSkill })
  update(
    @Param('etudiantId') etudiantId: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateEtudiantSkillDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<EtudiantSkill> {
    return this.etudiantSkillService.update(
      etudiantId,
      skillId,
      dto,
      currentUser,
    );
  }

  @Delete(':etudiantId/:skillId')
  @ApiOperation({ summary: 'Retirer un skill à un étudiant' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('etudiantId') etudiantId: string,
    @Param('skillId') skillId: string,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<void> {
    return this.etudiantSkillService.remove(etudiantId, skillId, currentUser);
  }
}
