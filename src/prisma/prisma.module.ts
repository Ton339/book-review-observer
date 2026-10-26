import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js'; // 💡 เติม .js

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
