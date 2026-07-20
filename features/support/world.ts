import {
  setWorldConstructor,
  World,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../../src/setup-app';

export function getServer(world: CustomWorld): App {
  return world.app.getHttpServer() as App;
}

export class CustomWorld extends World {
  app: INestApplication;
  response: request.Response;

  async initApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    configureApp(this.app);
    await this.app.init();
  }

  async closeApp() {
    await this.app?.close();
  }
}
setDefaultTimeout(15 * 1000);
setWorldConstructor(CustomWorld);
