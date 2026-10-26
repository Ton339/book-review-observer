import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const port = process.env.REVIEW_PORT ? Number(process.env.REVIEW_PORT) : 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

await bootstrap();
