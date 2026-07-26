import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { StorageService } from './storage.service';
import { FileEntity } from './file.entity';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './file-upload.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new UnsupportedMediaTypeException('Type de fichier non autorisé'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [FileController],
  providers: [FileService, StorageService],
  exports: [FileService],
})
export class FileModule {}
