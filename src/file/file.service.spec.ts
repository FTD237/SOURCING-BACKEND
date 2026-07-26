import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import { StorageService } from './storage.service';
import { Statut } from '../common/enum/statut.enum';

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

  const storageServiceMock = {
    upload: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    getSignedDownloadUrl: jest
      .fn()
      .mockResolvedValue('https://r2.example/signed-url'),
  };

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
        { provide: StorageService, useValue: storageServiceMock },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it("rejette l'upload si aucun fichier n'est fourni", async () => {
      await expect(
        service.create(undefined as never, owner.id),
      ).rejects.toThrow(BadRequestException);
      expect(storageServiceMock.upload).not.toHaveBeenCalled();
    });

    it('téléverse le contenu sur R2 puis persiste les métadonnées', async () => {
      const multerFile = {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('contenu'),
      } as Express.Multer.File;
      mockCreate.mockReturnValue(buildFile());
      mockSave.mockResolvedValue(buildFile());

      await service.create(multerFile, owner.id);

      expect(storageServiceMock.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.pdf$/),
        multerFile.buffer,
        'application/pdf',
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: owner.id,
          original_name: 'cv.pdf',
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

  describe('getDownloadUrl', () => {
    it('délègue la génération du lien signé au StorageService', async () => {
      const file = buildFile();

      const url = await service.getDownloadUrl(file);

      expect(storageServiceMock.getSignedDownloadUrl).toHaveBeenCalledWith(
        file.stored_name,
        file.original_name,
      );
      expect(url).toBe('https://r2.example/signed-url');
    });
  });

  describe('remove', () => {
    it('effectue une suppression logique et retire l’objet sur R2', async () => {
      const file = buildFile();
      mockFindOne.mockResolvedValue(file);
      mockSave.mockResolvedValue(file);

      await service.remove('file-1', owner);

      expect(file.statut).toBe(Statut.SUPPRIME);
      expect(file.dte_suppression).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalledWith(file);
      expect(storageServiceMock.delete).toHaveBeenCalledWith(file.stored_name);
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
