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

  async getReportByBookId(bookId: number) {
    // 1. คำนวณดาวทั้งหมด และค่าเฉลี่ยด้วย Prisma Aggregate
    const stats = await this.prisma.review.aggregate({
      where: { bookId },
      _sum: { rating: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    if (stats._count.id === 0) {
      throw new NotFoundException(`ไม่พบข้อมูลรีวิวสำหรับหนังสือ Book ID: ${bookId}`);
    }

    // 2. ดึงรายการเนื้อหา Review ทั้งหมดของหนังสือเล่มนี้
    const reviews = await this.prisma.review.findMany({
      where: { bookId },
      select: {
        id: true,
        comment: true,
        rating: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. จัดรูปแบบข้อมูลตอบกลับ
    return {
      bookId,
      totalReviews: stats._count.id,
      totalStars: stats._sum.rating || 0, // ผลรวมดาวทั้งหมด
      averageRating: Number((stats._avg.rating || 0).toFixed(2)), // ค่าเฉลี่ยดาว (ทศนิยม 2 ตำแหน่ง)
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