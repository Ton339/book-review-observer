import {
  Injectable,
  Logger, // 💡 เพิ่มการ import Logger
  InternalServerErrorException,
  NotFoundException, // 💡 เพิ่มการ import InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  // 💡 ประกาศพร็อพเพอร์ตี้ logger ภายในคลาส
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

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
      if (bookId === 999) {
        throw new Error(
          'QueryTimeoutException: Database query timed out while fetching aggregates for bookId 999',
        );
      }

      return await this.prisma.review.findMany({
        where: { bookId },
      });
    } catch (error: any) {
      // 🪵 พิมพ์ Log ตามปกติ - Observe SDK จะผูก Log นี้เข้ากับ Trace ปัจจุบันและ Forward ขึ้น Dashboard
      this.logger.error(
        `Failed to generate report for bookId: ${bookId} - Reason: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException({
        message:
          'Unable to process review report due to internal database failure.',
        bookId,
      });
    }
  }
}
