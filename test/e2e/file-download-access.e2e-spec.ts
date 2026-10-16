import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { FileController } from '../../src/file/file.controller';
import { FileService } from '../../src/file/file.service';
import { StorageService } from '../../src/file/storage.service';
import { FileEntity } from '../../src/file/file.entity';
import { User } from '../../src/user/user.entity';
import { JwtStrategy } from '../../src/auth/jwt-strategy';
import { Statut } from '../../src/common/enum/statut.enum';
import { Roles } from '../../src/common/enum/roles.enum';

const JWT_SECRET = 'test-secret-file-download';
const OWNER_ID = 'owner-user-id';
const FILE_ID = 'file-id-1';

/**
 * Reproduit le scénario du ticket : un utilisateur authentifié, non
 * propriétaire du fichier, tente de le télécharger. Vérifie le statut
 * HTTP réellement renvoyé selon son rôle.
 */
describe('GET /api/files/:id/download — contrôle d’accès (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const storedFile: Partial<FileEntity> = {
    id: FILE_ID,
    user_id: OWNER_ID,
    original_name: 'cv.pdf',
    stored_name: 'uuid-abc.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    statut: Statut.ACTIF,
  };

  const fileRepoMock = {
    findOne: jest.fn().mockResolvedValue(storedFile),
  };

  // Tout utilisateur porteur d'un token valide existe et est actif.
  const userRepoMock = {
    findOne: jest.fn(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        email: `${where.id}@example.com`,
        statut: Statut.ACTIF,
      }),
    ),
  };

  const storageServiceMock = {
    getSignedDownloadUrl: jest
      .fn()
      .mockResolvedValue('https://r2.example/signed-url'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret: JWT_SECRET })],
      controllers: [FileController],
      providers: [
        FileService,
        JwtStrategy,
        { provide: getRepositoryToken(FileEntity), useValue: fileRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: ConfigService, useValue: { get: () => JWT_SECRET } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const tokenFor = (id: string, role: string) =>
    jwtService.sign({ id, email: `${id}@example.com`, role });

  const download = (token: string) =>
    request(app.getHttpServer() as App)
      .get(`/api/files/${FILE_ID}/download`)
      .set('Authorization', `Bearer ${token}`);

  it('autorise le propriétaire du fichier (302 vers une URL signée)', async () => {
    const res = await download(tokenFor(OWNER_ID, Roles.ETUDIANT));

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://r2.example/signed-url');
  });

  it('autorise un admin sur le fichier d’un tiers', async () => {
    const res = await download(tokenFor('admin-id', Roles.ADMIN));

    expect(res.status).toBe(302);
  });

  it('autorise un RH sur le fichier d’un étudiant', async () => {
    const res = await download(tokenFor('rh-id', Roles.RH));

    expect(res.status).toBe(302);
  });

  it('autorise un manager sur le fichier d’un étudiant', async () => {
    const res = await download(tokenFor('manager-id', Roles.MANAGER));

    expect(res.status).toBe(302);
  });

  it('refuse un étudiant tiers avec 403 (et non 401)', async () => {
    const res = await download(tokenFor('autre-etudiant-id', Roles.ETUDIANT));

    expect(res.status).toBe(403);
  });

  it('refuse une requête sans token avec 401', async () => {
    const res = await request(app.getHttpServer() as App).get(
      `/api/files/${FILE_ID}/download`,
    );

    expect(res.status).toBe(401);
  });

  describe('la suppression reste plus restrictive que la lecture', () => {
    const remove = (token: string) =>
      request(app.getHttpServer() as App)
        .delete(`/api/files/${FILE_ID}`)
        .set('Authorization', `Bearer ${token}`);

    it("refuse à un RH de supprimer le fichier d'un étudiant", async () => {
      const res = await remove(tokenFor('rh-id', Roles.RH));

      expect(res.status).toBe(403);
    });

    it("refuse à un manager de supprimer le fichier d'un étudiant", async () => {
      const res = await remove(tokenFor('manager-id', Roles.MANAGER));

      expect(res.status).toBe(403);
    });
  });
});
