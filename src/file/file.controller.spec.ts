import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';

describe('FileController', () => {
  let controller: FileController;

  const fileServiceMock = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    getDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [{ provide: FileService, useValue: fileServiceMock }],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it("rejette l'upload si aucun fichier n'est fourni", async () => {
      await expect(
        controller.upload(undefined as never, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('délègue au service avec le fichier et son propriétaire', async () => {
      const multerFile = { originalname: 'cv.pdf' } as Express.Multer.File;
      fileServiceMock.create.mockResolvedValue({ id: 'file-1' });

      await controller.upload(multerFile, 'user-1');

      expect(fileServiceMock.create).toHaveBeenCalledWith(multerFile, 'user-1');
    });
  });

  describe('findAll', () => {
    it("liste les fichiers de l'utilisateur courant", async () => {
      fileServiceMock.findAllForUser.mockResolvedValue([]);

      await controller.findAll('user-1');

      expect(fileServiceMock.findAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('download', () => {
    it('redirige vers le lien signé fourni par le service', async () => {
      const file = { id: 'file-1' };
      fileServiceMock.findOne.mockResolvedValue(file);
      fileServiceMock.getDownloadUrl.mockResolvedValue(
        'https://r2.example/signed-url',
      );
      const redirect = jest.fn();
      const user = { id: 'user-1', role: 'etudiant' };

      await controller.download('file-1', user, { redirect } as never);

      expect(fileServiceMock.findOne).toHaveBeenCalledWith('file-1', user);
      expect(fileServiceMock.getDownloadUrl).toHaveBeenCalledWith(file);
      expect(redirect).toHaveBeenCalledWith('https://r2.example/signed-url');
    });
  });

  describe('remove', () => {
    it('délègue la suppression au service et confirme', async () => {
      fileServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('file-1', {
        id: 'user-1',
        role: 'etudiant',
      });

      expect(fileServiceMock.remove).toHaveBeenCalledWith('file-1', {
        id: 'user-1',
        role: 'etudiant',
      });
      expect(typeof result.message).toBe('string');
    });
  });
});
