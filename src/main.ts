import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.REVIEW_PORT ?? 3000);
  console.log("Book Review Service is running on port", process.env.REVIEW_PORT);
}
await bootstrap();
