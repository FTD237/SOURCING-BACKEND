import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('Files')
@UseGuards(JwtAuthGuard)
@Controller('api/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Upload d'un fichier" })
  @ApiResponse({ status: 201, description: 'Fichier téléversé avec succès' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');

    return this.fileService.create(file, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes fichiers' })
  @ApiResponse({ status: 200, description: 'Liste des fichiers' })
  findAll(@GetUser('id') userId: string) {
    return this.fileService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Métadonnées d'un fichier" })
  @ApiResponse({ status: 200, description: 'Métadonnées du fichier' })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  findOne(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.fileService.findOne(id, user);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un fichier' })
  @ApiResponse({ status: 200, description: 'Contenu du fichier' })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async download(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.fileService.findOne(id, user);
    const filePath = this.fileService.getFilePath(file);

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.original_name)}"`,
    });

    return new StreamableFile(createReadStream(filePath));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fichier' })
  @ApiResponse({ status: 200, description: 'Fichier supprimé' })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async remove(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ): Promise<{ message: string }> {
    await this.fileService.remove(id, user);

    return { message: 'Fichier supprimé avec succès' };
  }
}
