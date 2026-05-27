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
} from '@nestjs/common';
import { FormationService } from './formation.service';
import { CreateFormationDto, UpdateFormationDto } from './formation.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('formations')
export class FormationController {
  constructor(private readonly formationService: FormationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create formation',
    description: 'Créer une nouvelle formation',
  })
  @ApiResponse({
    status: 201,
    description: 'Formation crée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  create(@Body() dto: CreateFormationDto) {
    return this.formationService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get formation',
    description: 'Récupérer toutes les formations',
  })
  @ApiResponse({
    status: 200,
    description: 'Formations récupérées avec succès',
  })
  findAll() {
    return this.formationService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get formation by id',
    description: 'Récupérer une formation de part son id',
  })
  @ApiResponse({
    status: 200,
    description: 'Formation récupérée avec succès',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update formation',
    description: "Mettre à jour les informations d'une formation",
  })
  @ApiResponse({
    status: 200,
    description: 'Mise à jour réussie',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormationDto,
  ) {
    return this.formationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete formation',
    description: 'Suppression de la formation',
  })
  @ApiResponse({
    status: 200,
    description: 'Supprimée avec succès',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formationService.remove(id);
  }
}
