import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // ทำการเชื่อมต่อฐานข้อมูลเมื่อโมดูลเริ่มต้น
    await this.$connect();
  }

  async onModuleDestroy() {
    // ตัดการเชื่อมต่อฐานข้อมูลเมื่อแอปปิดตัวลง
    await this.$disconnect();
  }
}
