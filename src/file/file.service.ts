import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { FileEntity } from './file.entity';
import { Statut } from '../common/enum/statut.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

const ADMIN_ROLES = ['admin', 'super-admin'];

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {}

  async create(file: Express.Multer.File, userId: string): Promise<FileEntity> {
    const entity = this.fileRepository.create({
      user_id: userId,
      original_name: file.originalname,
      stored_name: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      create_by: userId,
    });

    return this.fileRepository.save(entity);
  }

  async findAllForUser(userId: string): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { user_id: userId, statut: Statut.ACTIF },
      order: { dte_creation: 'DESC' },
    });
  }

  async findOne(
    id: string,
    requester: { id: string; role: string },
  ): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file || file.statut === Statut.SUPPRIME) {
      ExceptionFactory.notFound('Fichier', id);
    }

    this.assertAccess(file, requester);

    return file;
  }

  getFilePath(file: FileEntity): string {
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') ?? './uploads';
    return join(uploadDir, file.stored_name);
  }

  async remove(
    id: string,
    requester: { id: string; role: string },
  ): Promise<void> {
    const file = await this.findOne(id, requester);

    file.statut = Statut.SUPPRIME;
    file.dte_suppression = new Date();
    file.updated_by = requester.id;
    await this.fileRepository.save(file);

    await unlink(this.getFilePath(file)).catch(() => undefined);
  }

  private assertAccess(
    file: FileEntity,
    requester: { id: string; role: string },
  ): void {
    const isOwner = file.user_id === requester.id;
    const isAdmin = ADMIN_ROLES.includes(requester.role);

    if (!isOwner && !isAdmin) {
      ExceptionFactory.forbidden("Vous n'avez pas accès à ce fichier");
    }
  }
}
