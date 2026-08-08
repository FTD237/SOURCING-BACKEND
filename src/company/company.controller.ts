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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { Roles as RolesEnum } from '../common/enum/roles.enum';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyResponseDto,
  UpdateCompanyDto,
} from './company.dto';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.SUPERADMIN)
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
  @Roles(
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
    RolesEnum.MANAGER,
    RolesEnum.ETUDIANT,
  )
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
  @Roles(
    RolesEnum.ADMIN,
    RolesEnum.MANAGER,
    RolesEnum.SUPERADMIN,
    RolesEnum.ETUDIANT,
  )
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
  @Roles(
    RolesEnum.ETUDIANT,
    RolesEnum.ADMIN,
    RolesEnum.SUPERADMIN,
    RolesEnum.MANAGER,
    RolesEnum.RH,
  )
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
  @Roles(RolesEnum.MANAGER, RolesEnum.ADMIN, RolesEnum.SUPERADMIN)
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
