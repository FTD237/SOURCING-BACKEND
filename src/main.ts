import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as process from 'node:process';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { configureApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  // Applique @Exclude()/@Expose() (class-transformer) à TOUTES les réponses
  // sortantes, ex. pour retirer password/resetPasswordToken de User avant
  // sérialisation en JSON. Sans ça, @Exclude() sur les entités n'a aucun
  // effet sur la réponse réellement envoyée au client.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Sourcing API')
      .setDescription("API pour l'application sourcing")
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}
void bootstrap();
