import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// 💡 ดึง path ของไฟล์ SQLite (เช่น ./dev.db)
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';

// 💡 ส่งเป็น Object { url: dbPath } แทนการสร้าง new Database()
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.review.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
        data: {

            name: 'John Doe',
        },
    });

    for (let i = 1; i <= 500; i++) {
        await prisma.review.create({
            data: {
                comment: `Great book part ${i}!`,
                rating: 5,
                bookId: 1,
                userId: user.id,
            },
        });
    }

    console.log('🌱 Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });