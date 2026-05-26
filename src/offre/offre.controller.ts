// ─── offre.controller.ts ─────────────────────────────────────────────────────
import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { OffreService } from './offre.service';
import { CreateOffreDto, UpdateOffreDto } from './offre.dto';

@Controller('offres')
export class OffreController {
  constructor(private readonly offreService: OffreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOffreDto) {
    return this.offreService.create(dto);
  }

  @Get()
  findAll() {
    return this.offreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOffreDto) {
    return this.offreService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.remove(id);
  }
}
