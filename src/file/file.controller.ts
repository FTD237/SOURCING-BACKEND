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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';
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
  @ApiOperation({
    summary: 'Obtenir un lien de téléchargement temporaire',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirection vers une URL signée (expire après 5 min)',
  })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async download(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.fileService.findOne(id, user);
    const url = await this.fileService.getDownloadUrl(file);

    res.redirect(url);
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
