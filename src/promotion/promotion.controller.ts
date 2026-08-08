import {
  Controller,
  Patch,
  Param,
  Body,
  Post,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PromotionCreateDto } from './dto/promotion-create.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Promotion')
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Promotion crée avec succès',
  })
  @ApiOperation({ summary: 'Create promotion' })
  async create(@Body() dto: PromotionCreateDto) {
    return this.promotionService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all promotion' })
  @ApiResponse({
    status: 200,
    description: 'Listes des promotions',
  })
  async findAll() {
    return this.promotionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/annee')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Modifier l'année de la promotion" })
  @ApiResponse({
    status: 200,
    description: 'Modiification de la promotion',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Identifiant unique de la promotion (UUID v4)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    schema: {
      type: 'string',
      format: 'uuid',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
  })
  @ApiBody({
    description: 'Données à mettre à jour',
    required: true,
    schema: {
      type: 'object',
      required: ['annee'],
      properties: {
        annee: {
          type: 'string',
          description: 'Nouvelle année de la promotion',
          example: '2025',
          minLength: 4,
          maxLength: 4,
          pattern: String.raw`^\d{4}$`,
        },
      },
    },
  })
  async updateAnnee(@Param('id') id: string, @Body('annee') annee: string) {
    return this.promotionService.update(id, { annee });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all promotion' })
  @ApiResponse({
    status: 200,
    description: 'Listes des promotions',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Identifiant unique de la promotion (UUID v4)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    schema: {
      type: 'string',
      format: 'uuid',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
  })
  async findOne(@Param('id') id: string) {
    return this.promotionService.findOne(id);
  }
}
