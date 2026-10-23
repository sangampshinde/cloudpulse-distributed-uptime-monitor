import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const corsOrigin = configService.get<string>('corsOrigin') || 'http://localhost:3000';

  // 1. Versioning: Global API prefix
  app.setGlobalPrefix('api/v1');

  // 2. Strict Input Validation & Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. CORS for Frontend communication
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 4. DevOps Standard: Graceful container shutdown on SIGTERM / SIGINT
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 CloudPulse Backend service is running on port: ${port}`);
  logger.log(`📊 Healthcheck endpoint: http://localhost:${port}/api/v1/health`);
  logger.log(`🔍 Monitors API endpoint: http://localhost:${port}/api/v1/monitors`);
}

bootstrap();
