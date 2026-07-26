import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './file-upload.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = config.get<string>('UPLOAD_DIR') ?? './uploads';
        mkdirSync(uploadDir, { recursive: true });

        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, callback) => {
              const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
              callback(null, uniqueName);
            },
          }),
          limits: { fileSize: MAX_FILE_SIZE_BYTES },
          fileFilter: (_req, file, callback) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
              callback(
                new UnsupportedMediaTypeException(
                  'Type de fichier non autorisé',
                ),
                false,
              );
              return;
            }
            callback(null, true);
          },
        };
      },
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
