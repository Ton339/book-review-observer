# Review Service (Microservice)

ระบบบริหารจัดการรีวิวหนังสือ (**Review Service**) พัฒนาด้วย **NestJS** และ **Prisma (SQLite)** รองรับ **Distributed Tracing & APM ผ่าน NestJS Observe** โดยออกแบบมาเพื่อสาธิตและเปรียบเทียบประสิทธิภาพปัญหา **N+1 Query** และการ Trace/Debug ข้อผิดพลาด

---

## 📌 คุณสมบัติหลัก (Features)

* **CRUD Operations:** จัดการข้อมูลรีวิวหนังสือ (สร้าง, อ่าน, แก้ไข, ลบ)
* **Trace Propagation:** รองรับการรับ Trace ID (`x-request-id`) ข้ามมาจาก Book Service ผ่าน HTTP Header อัตโนมัติ
* **N+1 Query Demonstration:** สลับการทำงานเพื่อทดสอบความแตกต่างของประสิทธิภาพบน NestJS Observe Dashboard ผ่าน Endpoint เดียวกัน
* **Error & Log Tracing:** มี Debug Scenario Endpoint ที่จำลองข้อผิดพลาดเพื่อทดสอบการผูก Application Logs เข้ากับ Distributed Traces บน NestJS Observe

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* **Framework:** NestJS (v12+)
* **ORM:** Prisma ORM (v7+)
* **Database:** SQLite (Better-SQLite3)
* **Observability:** `@nestjs/observe` (Auto-instrumentation & Log Forwarding)
* **Validation:** `class-validator`, `class-transformer`

---

## ⚙️ การติดตั้งและตั้งค่าระบบ (Installation & Setup)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม (.env)

คัดลอกไฟล์ `.env.example` หรือสร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
DATABASE_URL="file:./dev.db"

BOOK_PORT=3001
REVIEW_PORT=3002

OBSERVE_APP_KEY="your-observe-app-key"
OBSERVE_APP_SECRET="your-observe-app-secret"
```

> **หมายเหตุ:** `REVIEW_PORT` กำหนดพอร์ตของบริการนี้ (ค่าเริ่มต้นคือ `3002`) เพื่อไม่ให้ชนกับ Book Service (`3001`)

### 3. สร้างตารางและ Prisma Client

```bash
npx prisma db push
npx prisma generate
```

### 4. ใส่ข้อมูลจำลอง (Seed Data 500 รายการ)

สร้าง User ตัวอย่างและสคริปต์วน Loop สร้างรีวิว 500 รายการสำหรับ `bookId: 1`:

```bash
npx prisma db seed
```

### 5. เชื่อมต่อ NestJS Observe

หากยังไม่ได้ผูกโปรเจกต์กับ NestJS Observe CLI:

```bash
npx @nestjs/observe link
```

---

## 🚀 การสั่งรันโปรเจกต์ (Running the App)

```bash
# โหมด Development
npm run start:dev

# โหมด Production
npm run build
npm run start:prod
```

*(บริการรันบน Port 3002 ตาม `REVIEW_PORT` ใน `.env`)*

---

## 📍 รายการ API Endpoints

| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| `POST` | `/reviews` | สร้างรีวิวใหม่ |
| `GET` | `/reviews` | ดึงรายการรีวิวทั้งหมด |
| `GET` | `/reviews/book/:bookId` | ดึงรายการรีวิวตาม Book ID |
| `GET` | `/reviews/report/:bookId` | **รายงานสรุปผลรีวิว** (ใช้ทดสอบ N+1 Query / Optimized) |
| `GET` | `/reviews/report/debug/:bookId` | **Endpoint จำลอง Debug/Error** (จำลอง Timeout Error เมื่อ `bookId=999`) |
| `GET` | `/reviews/:id` | ดึงรีวิวตาม ID |
| `PATCH` | `/reviews/:id` | แก้ไขข้อมูลรีวิว |
| `DELETE` | `/reviews/:id` | ลบรีวิวตาม ID |

---

## 🧪 การสลับทดสอบ N+1 Query vs Optimized ใน Controller

ในไฟล์ [reviews.controller.ts](file:///e:/work/school/Team/book-review-observer/src/reviews/reviews.controller.ts) สามารถสลับการเรียกใช้งานระหว่าง **Optimized Query** และ **N+1 Query** ได้ตามต้องการ:

```typescript
@Get('report/:bookId')
getReportByBookId(@Param('bookId', ParseIntPipe) bookId: number) {
  // 🟢 แบบไม่มีปัญหา N+1 Query (Optimized Query - 1 DB Span ผ่าน include)
  return this.reviewsService.getReportByBookIdOptimized(bookId);

  // 🔴 แบบมีปัญหา N+1 Query (Unoptimized Query - 501 DB Spans)
  // return this.reviewsService.getReportByBookIdNPlusOne(bookId);
}
```

### ขั้นตอนการทดสอบบน NestJS Observe Dashboard

1. **ทดสอบกรณีมีปัญหา N+1 Query (ยิง DB 501 ครั้ง):**
   * สลับไปเปิดใช้งาน `getReportByBookIdNPlusOne` ใน Controller
   * ส่งคำขอทดสอบ:
     ```bash
     curl http://localhost:3002/reviews/report/1
     ```
   * ตรวจสอบบน [observe.nestjs.com](https://observe.nestjs.com) จะพบแถบ Database Query ซ้ำๆ จำนวน 501 รายการใน Waterfall Graph

2. **ทดสอบกรณีแก้ไขปัญหาแล้ว (Optimized Query):**
   * สลับไปเปิดใช้งาน `getReportByBookIdOptimized` ใน Controller
   * ส่งคำขอทดสอบ:
     ```bash
     curl http://localhost:3002/reviews/report/1
     ```
   * ตรวจสอบบน Dashboard จะพบว่า Spans ลดลงเหลือเพียง Query เดียว (ด้วย `include`) และ Response Latency ลดลงอย่างชัดเจน

---

## 🔍 การทดสอบ Error & Debug Scenario (Trace + Log Forwarding)

ระบบมีฟังก์ชันส่งออก Application Logs (`this.logger.error(...)`) ไปยัง NestJS Observe โดยตรงเพื่อตรวจสอบข้อผิดพลาดคู่กับ Trace

* ส่งคำขอที่ทำให้เกิดข้อผิดพลาดจำลอง:
  ```bash
  curl http://localhost:3002/reviews/report/debug/999
  ```
* ตรวจสอบบน NestJS Observe Dashboard:
  * Trace จะแสดงสถานะ Error (`500 Internal Server Error`)
  * แถบ Log และ Stack Trace ของ `QueryTimeoutException` จะถูกผูกเข้ากับ Trace ID เดียวกันโดยอัตโนมัติ