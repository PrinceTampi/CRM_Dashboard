# CRM Dashboard Project Overview

## Tujuan Website

CRM Dashboard adalah aplikasi **One Dashboard One Control** untuk memusatkan monitoring dan pengelolaan proses CRM, termasuk monitoring operasional, input data, upload data, pengecekan RO, serta modul program CRM.

Status saat ini: struktur route dan modul sedang dikembangkan. Beberapa halaman masih berupa fondasi atau placeholder dan belum boleh dianggap sebagai alur bisnis final.

## Tech Stack

- **Framework:** Next.js App Router 15.x
- **Language:** TypeScript
- **UI:** React 19.x
- **Styling:** Tailwind CSS 3.x dan CSS global pada `app/globals.css`
- **Database:** PostgreSQL
- **ORM:** Prisma 7.x dengan `@prisma/adapter-pg`
- **Validation and utilities:** Zod, clsx, use-debounce
- **Authentication:** next-auth beta sesuai versi pada `package.json`
- **Icons:** Heroicons React
- **Package manager:** npm didukung untuk instalasi lokal; repository juga menyimpan `pnpm-lock.yaml`

Versi dependency yang menjadi sumber kebenaran adalah `package.json` dan lockfile. Jangan mengubah versi hanya berdasarkan dokumen ini.

## Core Modules

### Dashboard and Monitoring

- `app/monitoring/`
- `app/monitoring/portal/`
- `component/monitoring/`
- Menyediakan area ringkasan dan monitoring CRM.

### Data Input and Upload

- `app/input-ahass/`
- `app/upload/`
- `component/input-ahass/`
- `component/upload/`
- Menjadi area untuk proses input dan upload data. Operasi tulis membutuhkan persetujuan sebelum implementasi.

### Operational Checking

- `app/pengecekan-ro/`
- `component/pengecekan-ro/`
- Menjadi area pengecekan RO.

### CRM Programs

- `app/express-h2/`
- `app/smartbirth/`
- `app/niguri-h3/`
- `app/monitoring-rcr/`
- `component/express-h2/`
- `component/smartbirth/`
- `component/niguri-h3/`
- `component/monitoring-rcr/`
- Menjadi area terpisah untuk program dan monitoring CRM.

### Data and Persistence

- `lib/data.ts`: akses dan query data aplikasi.
- `lib/definitions.ts`: tipe data aplikasi.
- `lib/prisma.ts`: singleton Prisma Client.
- `prisma/schema.prisma`: model database.
- `prisma/migrations/`: riwayat perubahan database; jangan diubah tanpa approval.
- `query/route.ts`: endpoint query.
- `seed/route.ts`: endpoint seed; operasi seed berpotensi menulis data.

## Developer Requirements

Install kebutuhan berikut:

- Node.js LTS, minimal versi yang kompatibel dengan Next.js pada `package.json`.
- npm yang tersedia bersama Node.js.
- PostgreSQL yang dapat diakses oleh aplikasi.
- Git.
- VS Code atau editor TypeScript lain.

Konfigurasi lokal:

1. Salin environment template jika tersedia menjadi `.env`.
2. Isi `DATABASE_URL` dengan koneksi PostgreSQL lokal atau environment development.
3. Jangan commit file `.env` atau secret.
4. Jalankan `npm install` dari folder `nextjs-dashboard`.
5. Jalankan `npx prisma generate` setelah instalasi dependency.

## Project Structure

```text
nextjs-dashboard/
├── app/                 # Route dan layout Next.js App Router
├── component/           # Komponen UI berdasarkan jenis/domain halaman
├── ui/                  # Komponen UI starter dan komponen reusable lama
├── lib/                 # Data access, tipe, utilitas, Prisma client
├── prisma/              # Schema dan migration database
├── public/              # Asset publik
├── query/               # Route handler query
├── seed/                # Route handler seed
├── docs/                # Dokumentasi proyek dan aturan AI
├── package.json         # Dependency dan script
├── tsconfig.json        # Konfigurasi TypeScript
├── tailwind.config.ts   # Konfigurasi Tailwind
└── next.config.ts       # Konfigurasi Next.js
```

## Scripts

Jalankan dari `nextjs-dashboard/`:

| Command | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server dengan Turbopack |
| `npm run build` | Membuat production build dan menjalankan type checking Next.js |
| `npm run start` | Menjalankan hasil production build |
| `npm install` | Memasang dependency project |
| `npx prisma generate` | Menghasilkan Prisma Client |
| `npx prisma validate` | Memvalidasi schema Prisma tanpa mengubah database |

Project belum mendefinisikan script lint atau test khusus di `package.json`. Jangan mengklaim validasi tersebut sudah tersedia sebelum script-nya ditambahkan.
