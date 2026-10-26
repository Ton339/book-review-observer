import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "npx tsx prisma/seed.ts", // 💡 เปลี่ยนมาใช้ npx tsx แทน
    },
    datasource: {
        url: process.env["DATABASE_URL"],
    },
});