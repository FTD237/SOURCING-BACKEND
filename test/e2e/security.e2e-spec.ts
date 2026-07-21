import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/setup-app';

function getServer(app: INestApplication): App {
  return app.getHttpServer() as App;
}

describe('Security headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet', () => {
    it('renvoie les headers de sécurité standards sur toute réponse', async () => {
      const response = await request(getServer(app)).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it("n'expose pas le header X-Powered-By révélant la stack technique", async () => {
      const response = await request(getServer(app)).get('/');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS', () => {
    it('autorise une origine explicitement whitelistée', async () => {
      const allowedOrigin = process.env.CORS_ORIGINS?.split(',')[0]?.trim();
      if (!allowedOrigin) {
        return;
      }

      const response = await request(getServer(app))
        .get('/')
        .set('Origin', allowedOrigin);

      expect(response.headers['access-control-allow-origin']).toBe(
        allowedOrigin,
      );
    });

    it('ne reflète pas une origine non autorisée dans les headers CORS', async () => {
      const response = await request(getServer(app))
        .get('/')
        .set('Origin', 'https://origine-non-autorisee.example');

      expect(response.headers['access-control-allow-origin']).not.toBe(
        'https://origine-non-autorisee.example',
      );
    });
  });
});
