import { Injectable, NotFoundException } from '@nestjs/common';


import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) { }

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

  // 🔴 1. แบบที่มีปัญหา N+1 Query (สำหรับพรีเซนต์เปรียบเทียบบน NestJS Observe)
  async getReportByBookIdNPlusOne(bookId: number) {
    // Query ที่ 1: ดึงรีวิวทั้งหมด 500 รายการของหนังสือเล่มนี้
    const reviews = await this.prisma.review.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      throw new NotFoundException(`ไม่พบข้อมูลรีวิวสำหรับ Book ID: ${bookId}`);
    }

    // 💥 เกิด N Queries: วน Loop 500 รอบเพื่อยิง DB ดึงข้อมูล User ทีละคนในลูป!
    const reviewsWithUser = [];
    let totalStars = 0;

    for (const review of reviews) {
      const user = await this.prisma.user.findUnique({
        where: { id: review.userId },
      });

      totalStars += review.rating;
      reviewsWithUser.push({
        id: review.id,
        comment: review.comment,
        rating: review.rating,
        reviewerName: user?.name,
        createdAt: review.createdAt,
      });
    }

    return {
      bookId,
      totalReviews: reviews.length,
      totalStars,
      averageRating: Number((totalStars / reviews.length).toFixed(2)),
      reviews: reviewsWithUser,
    };
  }

  // 🟢 2. แบบไม่มีปัญหา N+1 Query (Optimized)
  async getReportByBookId(bookId: number) {
    // Query ที่ 1: สรุปผลดาวรวมและค่าเฉลี่ยด้วย Prisma Aggregate
    const stats = await this.prisma.review.aggregate({
      where: { bookId },
      _sum: { rating: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    if (stats._count.id === 0) {
      throw new NotFoundException(`ไม่พบข้อมูลรีวิวสำหรับ Book ID: ${bookId}`);
    }

    // Query ที่ 2: ดึงรีวิวพร้อม JOIN ข้อมูล User ด้วย `include` ภายใน Query เดียว
    const reviews = await this.prisma.review.findMany({
      where: { bookId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      bookId,
      totalReviews: stats._count.id,
      totalStars: stats._sum.rating || 0,
      averageRating: Number((stats._avg.rating || 0).toFixed(2)),
      reviews: reviews.map((r) => ({
        id: r.id,
        comment: r.comment,
        rating: r.rating,
        reviewerName: r.user.name,
        createdAt: r.createdAt,
      })),
    };
  }

}