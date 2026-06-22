import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { EncryptionMiddleware } from './common/middleware/encryption.middleware';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    // 1. Logging (Pino)
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),

    // 2. Caching (In-memory for start, can swap to Redis)
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
      max: 100, // maximum number of items in cache
    }),

    // 3. Database (PostgreSQL with TypeORM Repository Pattern)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: 5432,
      username: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'legal_db',
      autoLoadEntities: true,
      synchronize: true, // TODO: Development ortamı için true. Canlıda false olmalı ve migration kullanılmalı!
    }),

    // 4. Custom Modules
    RagModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // EncryptionMiddleware handles payload decrypt/encrypt, LoggerMiddleware logs request details
    consumer.apply(EncryptionMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
