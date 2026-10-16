import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { FileEntity } from './file.entity';
import { StorageService } from './storage.service';
import { Statut } from '../common/enum/statut.enum';
import { Roles } from '../common/enum/roles.enum';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

/**
 * Rôles autorisés à consulter et télécharger le fichier d'un autre
 * utilisateur. Aligné sur `GET /etudiants/:id`, qui laisse déjà ces
 * rôles consulter la fiche d'un étudiant : sans cela, la fiche est
 * visible mais ses pièces jointes restent inaccessibles.
 */
const STAFF_READ_ROLES = new Set<string>([
  Roles.ADMIN,
  Roles.SUPERADMIN,
  Roles.MANAGER,
  Roles.RH,
]);

/**
 * Suppression volontairement plus restrictive que la lecture : un RH
 * consulte les pièces d'un étudiant, mais ne les supprime pas.
 */
const ADMIN_DELETE_ROLES = new Set<string>([Roles.ADMIN, Roles.SUPERADMIN]);

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly storageService: StorageService,
  ) {}

  async create(file: Express.Multer.File, userId: string): Promise<FileEntity> {
    if (!file) ExceptionFactory.badRequest('Aucun fichier fourni');

    const key = `${randomUUID()}${extname(file.originalname)}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    const entity = this.fileRepository.create({
      user_id: userId,
      original_name: file.originalname,
      stored_name: key,
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

    this.assertCanRead(file, requester);

    return file;
  }

  async getDownloadUrl(file: FileEntity): Promise<string> {
    return this.storageService.getSignedDownloadUrl(
      file.stored_name,
      file.original_name,
    );
  }

  async remove(
    id: string,
    requester: { id: string; role: string },
  ): Promise<void> {
    const file = await this.findOne(id, requester);
    this.assertCanDelete(file, requester);

    file.statut = Statut.SUPPRIME;
    file.dte_suppression = new Date();
    file.updated_by = requester.id;
    await this.fileRepository.save(file);

    await this.storageService.delete(file.stored_name).catch(() => undefined);
  }

  private assertCanRead(
    file: FileEntity,
    requester: { id: string; role: string },
  ): void {
    const isOwner = file.user_id === requester.id;

    if (!isOwner && !STAFF_READ_ROLES.has(requester.role)) {
      ExceptionFactory.forbidden("Vous n'avez pas accès à ce fichier");
    }
  }

  private assertCanDelete(
    file: FileEntity,
    requester: { id: string; role: string },
  ): void {
    const isOwner = file.user_id === requester.id;

    if (!isOwner && !ADMIN_DELETE_ROLES.has(requester.role)) {
      ExceptionFactory.forbidden(
        "Vous n'êtes pas autorisé à supprimer ce fichier",
      );
    }
  }
}
