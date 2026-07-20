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
import { ExperienceService } from './experience.service';
import { CreateExperienceDto, UpdateExperienceDto } from './experience.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('experiences')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creating experience' })
  @ApiResponse({
    status: 201,
    description: 'Successfully created experience',
  })
  @ApiResponse({ status: 400, description: 'Expérience existante' })
  create(@Body() dto: CreateExperienceDto) {
    return this.experienceService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get experience' })
  @ApiResponse({
    status: 200,
    description: 'Successfully found experience',
  })
  findAll() {
    return this.experienceService.findAll();
  }

  @Get('etudiant/:studentId')
  @ApiOperation({ summary: 'Récupérer une expérience' })
  @ApiResponse({
    status: 200,
    description: "Récupérer une expérience par l'id de l'étudiant",
  })
  findByEtudiant(@Param('studentId', ParseIntPipe) studentId: string) {
    return this.experienceService.findByEtudiant(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une expérience' })
  @ApiResponse({
    status: 200,
    description: 'Récupérer une expérience par son id',
  })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.experienceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une expérience' })
  @ApiResponse({
    status: 200,
    description: "Modifier les informations d'une expérience",
  })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.experienceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete experience' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted experience',
  })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.experienceService.remove(id);
  }
}
