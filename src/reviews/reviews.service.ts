import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService, // 💡 Inject UsersService เข้ามา
  ) { }

  // 1. Create - บันทึกรีวิวลง Database
  async create(dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        bookId: dto.bookId,
        comment: dto.comment,
        userId: dto.userId,
        rating: dto.rating ?? 5,
      },
      include: {
        user: true,
      },
    });
  }

  // 2. Read All - ดึงรีวิวทั้งหมด
  async findAll() {
    return this.prisma.review.findMany({
      include: { user: true },
    });
  }

  // Read By Book ID - ดึงรีวิวเฉพาะของหนังสือเล่มนั้นๆ
  async findByBookId(bookId: number) {
    return this.prisma.review.findMany({
      where: { bookId },
      include: { user: true },
    });
  }

  // Read One - ดึงรีวิวตาม ID
  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }

  // 3. Update - แก้ไขรีวิว
  async update(id: number, dto: UpdateReviewDto) {
    await this.findOne(id); // ตรวจสอบว่ามีข้อมูลก่อนแก้
    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  // 4. Delete - ลบรีวิว
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.review.delete({
      where: { id },
    });
  }

  // 🔴 1. แบบ N+1 Query (ยิง Query ใน ลูปผ่าน UsersService)
  async getReportByBookIdNPlusOne(bookId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { bookId },
    });
    const reviewsWithUser = [];
    for (const review of reviews) {
      // 💡 เรียกผ่าน usersService.findById ทุกรอบในลูป
      const user = await this.usersService.findById(review.userId);
      reviewsWithUser.push({ ...review, user });
    }
    return reviewsWithUser;
  }

  // 🟢 2. แบบ Optimized Query (แก้ N+1 ใช้ JOIN/include)
  async getReportByBookIdOptimized(bookId: number) {
    return this.prisma.review.findMany({
      where: { bookId },
      include: {
        user: true, // ดึงข้อมูล User พร้อม Review ใน Query เดียว
      },
    });
  }

  async getReportWithDebugScenario(bookId: number) {
    this.logger.log(`Starting generation of report for bookId: ${bookId}`);

    try {
      // 🧪 จำลองสถานการณ์: หาก bookId = 999 ให้เกิด Database Query Failure
      if (bookId === 999) {
        throw new Error('QueryTimeoutException: Database query timed out while fetching aggregates for bookId 999');
      }

      return await this.prisma.review.findMany({
        where: { bookId },
      });
    } catch (error: any) {
      // 🪵 LOGS: พิมพ์ Log ระดับ ERROR พร้อม Stack Trace
      // NestJS Observe จะดักจับ Log นี้ไปผูกเข้ากับ Trace ID ปัจจุบันให้อัตโนมัติ (Auto-correlation)
      this.logger.error(
        `Failed to generate report for bookId: ${bookId} - Reason: ${error.message}`,
        error.stack,
      );

      // 💥 TRACES: เมื่อโยน Exception ออกไป Observe จะทำเครื่องหมาย Span นั้นเป็น Status: ERROR (แถบสีแดง)
      throw new InternalServerErrorException({
        message: 'Unable to process review report due to internal database failure.',
        bookId,
      });
    }
  }
}
