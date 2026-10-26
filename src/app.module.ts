import 'dotenv/config'; // 💡 ต้องอยู่บรรทัดแรกเพื่อโหลดค่า .env ก่อนคลาสทำงาน
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ReviewsModule } from './reviews/reviews.module.js';

// 1. เรียก createObserveModule โดยไม่ใส่ appKey
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // 2. ใส่ appKey, appSecret, forwardLogs ไว้ใน ObserveModule.forRoot()
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: 'book-review-observer',
      outgoing: {
        database: true,
        http: true,
      },
      forwardLogs: true, // 💡 เปิดสตรีม Log เข้าหา Trace ID
      redaction: {
        enabled: true,
        keys: ['internalToken'],
        patterns: [/acct_[a-z0-9]{16}/gi],
      },
    }),
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
