import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS ayarları (Frontend entegrasyonu için)
  app.enableCors();

  // Swagger (OpenAPI) Dokümantasyon Kurulumu
  const config = new DocumentBuilder()
    .setTitle('AI Legal Assistant API')
    .setDescription('AI Hukuk Asistanı — Kimlik doğrulama ve RAG API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
