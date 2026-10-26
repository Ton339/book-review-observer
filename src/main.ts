import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { PrismaInstrumentation } from '@prisma/instrumentation';

// 💡 ดักจับ Prisma Query Engine เข้ากับ OpenTelemetry ก่อนรันแอป
registerInstrumentations({
  instrumentations: [new PrismaInstrumentation()],
});

import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.REVIEW_PORT ?? '');
  console.log(
    `Review Service is running on port ${process.env.REVIEW_PORT ?? ''}`,
  );
}
await bootstrap();
