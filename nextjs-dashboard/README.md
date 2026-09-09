# CRM Dashboard

CRM Dashboard adalah aplikasi **One Dashboard One Control** untuk memusatkan
monitoring dan pengelolaan proses CRM.

## Dokumentasi

Dokumentasi teknis dan aturan kerja berada di folder `docs/`.

- [Project overview](docs/PROJECT-OVERVIEW.md): tech stack, modul, requirement,
	struktur folder, dan script.
- [AI documentation index](docs/AI-DOCUMENTATION-INDEX.md): aturan dokumen yang
	dibaca AI berdasarkan scope pekerjaan.
- [Gemini restrictions](docs/GEMINI-RESTRICTIONS.md): batas perubahan AI dan
	approval untuk data atau file penting.
- [Conventional Commits](docs/CONVENTIONAL-COMMITS.md): standar pesan commit.
- [Changelog](docs/CHANGELOG.md): perubahan dan to-do berkelanjutan.

## Quick Start

Jalankan dari folder `nextjs-dashboard/`:

```bash
npm install
npx prisma generate
npm run dev
```

Project memerlukan PostgreSQL dan `DATABASE_URL` pada environment development.
Jangan commit file `.env` atau credential.

## Validasi

```bash
npm run build
```

Detail struktur dan command lain tersedia di
[docs/PROJECT-OVERVIEW.md](docs/PROJECT-OVERVIEW.md).
