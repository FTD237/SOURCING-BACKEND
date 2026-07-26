import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fsPromises from 'node:fs/promises';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import { Statut } from '../common/enum/statut.enum';

jest.mock('node:fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('FileService', () => {
  let service: FileService;

  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockCreate = jest.fn();
  const mockSave = jest.fn();

  const repoMock = {
    findOne: mockFindOne,
    find: mockFind,
    create: mockCreate,
    save: mockSave,
  };

  const configServiceMock = { get: jest.fn().mockReturnValue('./uploads') };

  const owner = { id: 'user-1', role: 'etudiant' };
  const admin = { id: 'admin-1', role: 'admin' };
  const stranger = { id: 'user-2', role: 'etudiant' };

  const buildFile = (overrides: Partial<FileEntity> = {}): FileEntity =>
    ({
      id: 'file-1',
      user_id: owner.id,
      original_name: 'cv.pdf',
      stored_name: 'uuid-abc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      statut: Statut.ACTIF,
      dte_suppression: null,
      ...overrides,
    }) as FileEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: getRepositoryToken(FileEntity), useValue: repoMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('persiste les métadonnées du fichier uploadé', async () => {
      const multerFile = {
        originalname: 'cv.pdf',
        filename: 'uuid-abc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;
      mockCreate.mockReturnValue(buildFile());
      mockSave.mockResolvedValue(buildFile());

      await service.create(multerFile, owner.id);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: owner.id,
          original_name: 'cv.pdf',
          stored_name: 'uuid-abc.pdf',
        }),
      );
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it("lève NotFoundException si le fichier n'existe pas", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('unknown', owner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si le fichier est déjà supprimé', async () => {
      mockFindOne.mockResolvedValue(buildFile({ statut: Statut.SUPPRIME }));

      await expect(service.findOne('file-1', owner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("lève ForbiddenException si l'utilisateur n'est pas propriétaire ni admin", async () => {
      mockFindOne.mockResolvedValue(buildFile());

      await expect(service.findOne('file-1', stranger)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('autorise le propriétaire', async () => {
      const file = buildFile();
      mockFindOne.mockResolvedValue(file);

      await expect(service.findOne('file-1', owner)).resolves.toEqual(file);
    });

    it('autorise un admin même sans être propriétaire', async () => {
      const file = buildFile();
      mockFindOne.mockResolvedValue(file);

      await expect(service.findOne('file-1', admin)).resolves.toEqual(file);
    });
  });

  describe('remove', () => {
    it('effectue une suppression logique et retire le fichier physique', async () => {
      const file = buildFile();
      mockFindOne.mockResolvedValue(file);
      mockSave.mockResolvedValue(file);

      await service.remove('file-1', owner);

      expect(file.statut).toBe(Statut.SUPPRIME);
      expect(file.dte_suppression).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalledWith(file);
      expect(fsPromises.unlink).toHaveBeenCalled();
    });

    it("refuse la suppression si l'utilisateur n'a pas accès", async () => {
      mockFindOne.mockResolvedValue(buildFile());

      await expect(service.remove('file-1', stranger)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
