import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as process from 'node:process';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { configureApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);
  app.enableCors();

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

  if (process.env.NODE_ENV === 'production') {
    try {
      fs.writeFileSync(
        './swagger-spec.json',
        JSON.stringify(document, null, 2),
      );
      console.log('JSON file saved: ./swagger-spec.json');
    } catch (error) {
      console.log('Cannot write swagger file, skipping...', error);
    }
  }
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}
void bootstrap();
