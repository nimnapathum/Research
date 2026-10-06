import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(express.json({ limit: '6mb' }));
  app.enableShutdownHooks();
  const port = Number(process.env.API_PORT || 4000);
  const host = process.env.API_HOST || '127.0.0.1';
  await app.listen(port, host);
  console.log(`Research portal API listening on http://${host}:${port}`);
}
void bootstrap();
