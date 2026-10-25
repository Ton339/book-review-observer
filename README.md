# Review Service (Microservice)

ระบบบริหารจัดการรีวิวหนังสือ (**Review Service**) พัฒนาด้วย **NestJS** และ **Prisma (SQLite)** รองรับ **Distributed Tracing & APM ผ่าน NestJS Observe** โดยออกแบบมาเพื่อสาธิตและเปรียบเทียบประสิทธิภาพปัญหา **N+1 Query**

---

## 📌 คุณสมบัติหลัก (Features)

* **CRUD Operations:** จัดการข้อมูลรีวิวหนังสือ (สร้าง, อ่าน, แก้ไข, ลบ)
* **Trace Propagation:** รองรับการรับ Trace ID (`x-request-id`) ข้ามมาจาก Book Service ผ่าน HTTP Header อัตโนมัติ
* **N+1 Query Demonstration:** สลับการทำงานเพื่อทดสอบความแตกต่างของประสิทธิภาพบน NestJS Observe Dashboard ผ่าน Endpoint เดียวกัน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* **Framework:** NestJS (v11+)
* **ORM:** Prisma ORM (v6+)
* **Database:** SQLite
* **Observability:** `@nestjs/observe` (Auto-instrumentation)
* **Validation:** `class-validator`, `class-transformer`

---

## ⚙️ การติดตั้งและตั้งค่าระบบ (Installation & Setup)

### 1. ติดตั้ง Dependencies

```bash
npm install

```

### 2. ตั้งค่า Database & Prisma

```bash
npx prisma db push
npx prisma generate

```

### 3. ใส่ข้อมูลจำลอง (Seed Data 500 รายการ)

สร้าง User ตัวอย่างและสคริปต์วน Loop สร้างรีวิว 500 รายการสำหรับ `bookId: 1`:

```bash
npx prisma db seed

```

### 4. เชื่อมต่อ NestJS Observe

```bash
npx @nestjs/observe link

```

---

## 🚀 การสั่งรันโปรเจกต์ (Running the App)

```bash
npm run start:dev

```

*(บริการรันบน Port 3001)*

---

## 📍 รายการ API Endpoints

| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| `POST` | `/reviews` | สร้างรีวิวใหม่ |
| `GET` | `/reviews` | ดึงรายการรีวิวทั้งหมด |
| `GET` | `/reviews/book/:bookId` | ดึงรายการรีวิวตาม Book ID |
| `GET` | `/reviews/report/:bookId` | **รายงานสรุปผลรีวิว** (ใช้ทดสอบ N+1 Query / Optimized) |
| `GET` | `/reviews/:id` | ดึงรีวิวตาม ID |
| `PATCH` | `/reviews/:id` | แก้ไขข้อมูลรีวิว |
| `DELETE` | `/reviews/:id` | ลบรีวิวตาม ID |

---

## 🧪 การสลับทดสอบ N+1 Query vs Optimized ใน Controller

ในไฟล์ `src/reviews/reviews.controller.ts` สามารถเปิด-ปิดคอมเมนต์เพื่อสลับการเรียกใช้งานระหว่าง **N+1 Query** และ **Optimized Query** ได้ตามต้องการ:

```typescript
@Get('report/:bookId')
getReportByBookId(@Param('bookId', ParseIntPipe) bookId: number) {
  // 🟢 แบบไม่มีปัญหา N+1 Query (Optimized Query - 2 DB Spans)
  // return this.reviewsService.getReportByBookId(bookId);

  // 🔴 แบบมีปัญหา N+1 Query (Unoptimized Query - 501 DB Spans)
  return this.reviewsService.getReportByBookIdNPlusOne(bookId);
}

```

### ขั้นตอนการทดสอบบน NestJS Observe Dashboard

1. **ทดสอบกรณีมีปัญหา N+1 Query (ยิง DB 501 ครั้ง):**
* ตรวจสอบให้แน่ใจว่าเปิดใช้งาน `getReportByBookIdNPlusOne` ใน Controller
* ยิง Request ทดสอบ:
```bash
curl http://localhost:3001/reviews/report/1

```


* ตรวจสอบบน [observe.nestjs.com](https://observe.nestjs.com) จะพบแถบ Prisma Query ซ้ำๆ จำนวน 501 รายการใน Waterfall Graph


2. **ทดสอบกรณีแก้ไขปัญหาแล้ว (ยิง DB 2 ครั้ง):**
* สลับไปคอมเมนต์ปิด N+1 แล้วเปิดใช้งาน `getReportByBookId` แทน
* ยิง Request คำสั่งเดิม:
```bash
curl http://localhost:3001/reviews/report/1

```


* ตรวจสอบบน Dashboard จะพบว่า Spans ลดลงเหลือเพียง 2 รายการ และ Response Latency ลดลงอย่างชัดเจน