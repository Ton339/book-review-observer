import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 💡 ทุกครั้งที่เมธอดนี้ถูกเรียก @nestjs/observe จะบันทึกเป็น 1 Span ย่อยบน Waterfall
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}