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
  CreateEtudiantResponseDto,
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
import { GetUser } from '../auth/get-user.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Etudiant')
@Controller('etudiants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EtudiantController {
  constructor(private readonly etudiantService: EtudiantService) {}

  @Post()
  @Roles('admin', 'manager', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer un étudiant (utilisateur + profil)',
    description:
      'Le mot de passe est généré automatiquement et retourné dans la réponse',
  })
  @ApiResponse({
    status: 201,
    description: 'Étudiant créé avec succès',
    type: CreateEtudiantResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(
    @Body() dto: CreateEtudiantDto,
    @GetUser() currentUser: { id: string; email: string },
  ): Promise<CreateEtudiantResponseDto> {
    return this.etudiantService.create(dto, currentUser);
  }

  @Get()
  @Roles('rh', 'manager', 'admin', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all etudiant' })
  @ApiResponse({
    status: 200,
    description: 'Liste des étudiants',
  })
  findAll() {
    return this.etudiantService.findAll();
  }

  @Get(':id')
  @Roles('rh', 'manager', 'admin', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un étudiant grâce à son id' })
  @ApiResponse({
    status: 200,
    description: 'Récupérer un étudiant par son id',
  })
  findOne(@Param('id') id: string) {
    return this.etudiantService.findOne(id);
  }

  @Put(':id')
  @Roles('etudiant', 'admin', 'super-admin', 'manager')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Modifier les informations d'un étudiant" })
  @ApiParam(UpdateEtudiantDto)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEtudiantDto,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.etudiantService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles('manager', 'admin', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un étudiant' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.etudiantService.remove(id, currentUser);
  }
}
