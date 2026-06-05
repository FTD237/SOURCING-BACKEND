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
import { EtudiantService } from './etudiant.service';
import {
  CreateEtudiantDto,
  EtudiantResponseDto,
  UpdateEtudiantDto,
} from './etudiant.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Etudiant')
@Controller('etudiants')
export class EtudiantController {
  constructor(private readonly etudiantService: EtudiantService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create Etudiant',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create new etudiant',
    type: EtudiantResponseDto,
  })
  create(@Body() dto: CreateEtudiantDto) {
    return this.etudiantService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all etudiant' })
  @ApiResponse({
    status: 200,
    description: 'Liste des étudiants',
    type: [EtudiantResponseDto],
  })
  findAll() {
    return this.etudiantService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un étudiant grâce à son id' })
  @ApiResponse({
    status: 200,
    description: 'Récupérer un étudiant par son id',
    type: EtudiantResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.etudiantService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Modifier les informations d'un étudiant" })
  @ApiParam(UpdateEtudiantDto)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEtudiantDto,
  ) {
    return this.etudiantService.update(id, dto);
  }

  //TODO: changer le delete pour ne pas supprimer complétement la ressource mais juste changer le statut
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.etudiantService.remove(id);
  }
}
