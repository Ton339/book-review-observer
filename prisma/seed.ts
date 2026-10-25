import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. ล้างข้อมูลรีวิวเก่าก่อนเพื่อความสะอาด
    await prisma.review.deleteMany();
    await prisma.user.deleteMany();

    // เอา id: 1 และ id: 2
    // สร้าง User ตัวอย่างสำหรับไว้ใช้อ้างอิง userId
    const user1 = await prisma.user.create({
        data: {
            id: 1, // กำหนด ID = 1 ไว้ใช้งานใน Book Service
            name: 'Sithachad',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            id: 2,
            name: 'Developer',
        },
    });

    console.log('✅ Seed users successfully:', { user1, user2 });

    // 2. เตรียมข้อมูลสำหรับ Seed 500 รายการผ่าน Loop
    const reviewsData = [];

    for (let i = 1; i <= 500; i++) {
        // สุ่มดาวระหว่าง 1 ถึง 5
        const randomRating = Math.floor(Math.random() * 5) + 1;
        // กำหนด bookId เป็น 1
        const targetBookId = 1;
        // กระจาย userId ระหว่าง 1 ถึง 2 (จากที่เคย Seed ไว้)
        const targetUserId = (i % 2) + 1;

        reviewsData.push({
            comment: `รีวิวฉบับที่ ${i}: หนังสือเล่มนี้อ่านแล้วได้ความรู้ดีมาก เนื้อหาเข้มข้น ประทับใจมากครับ`,
            rating: randomRating,
            bookId: targetBookId,
            userId: targetUserId,
        });
    }

    // 3. บันทึกข้อมูล 500 รายการลง Database
    await prisma.review.createMany({
        data: reviewsData,
    });

    console.log('✅ Seed 500 reviews successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });