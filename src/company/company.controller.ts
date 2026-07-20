import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
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
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';

@ApiTags('Company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer une entreprise',
    description: "Création du compte d'une entreprise",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entreprise créee avec succès',
    type: CreateCompanyDto,
  })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(
    @Body() dto: CreateCompanyDto,
    @GetUser() currentUser: { id: string; name: string },
  ): Promise<CreateCompanyResponseDto> {
    return this.companyService.create(dto, currentUser);
  }

  @Get()
  @Roles('admin', 'manager', 'super-admin', 'etudiant')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all company' })
  @ApiResponse({
    status: 200,
    description: 'Liste des entreprises',
  })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'manager', 'super-admin', 'etudiant')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer une entreprise grâce à son id' })
  @ApiResponse({
    status: 200,
    description: 'Récupérer une entreprise par son id',
  })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Put(':id')
  @Roles('etudiant', 'admin', 'super-admin', 'manager', 'rh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Modifier les informations de l'entreprise" })
  @ApiParam(UpdateCompanyDto)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.companyService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles('manager', 'admin', 'super-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer une entreprise' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @GetUser() currentUser: { id: string; email: string },
  ) {
    return this.companyService.remove(id, currentUser);
  }
}
