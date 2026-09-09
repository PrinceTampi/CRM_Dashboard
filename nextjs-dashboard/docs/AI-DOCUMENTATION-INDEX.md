# AI Documentation Index

Dokumen di folder `docs/` dibaca berdasarkan scope pekerjaan, bukan semuanya sekaligus.

## Aturan Pembacaan

1. Selalu baca `docs/GEMINI-RESTRICTIONS.md` atau `docs/AI-RESTRICTIONS.md` sebelum mengubah file.
2. Baca `docs/PROJECT-OVERVIEW.md` hanya ketika pekerjaan menyentuh struktur, tech stack, modul, dependency, atau script.
3. Baca `docs/CONVENTIONAL-COMMITS.md` hanya ketika pekerjaan menyentuh commit, branch, changelog, atau pesan commit.
4. Baca `docs/CHANGELOG.md` hanya ketika mencatat perubahan atau memperbarui to-do list.
5. Baca dokumen domain tambahan hanya jika file tersebut relevan dengan scope permintaan.

## Mapping Scope

| Scope pekerjaan | Dokumen yang wajib dibaca |
| --- | --- |
| Perubahan kode umum | `GEMINI-RESTRICTIONS.md`, `AI-RESTRICTIONS.md` |
| Struktur atau arsitektur | `PROJECT-OVERVIEW.md` |
| Database atau Prisma | `PROJECT-OVERVIEW.md`, restriction yang relevan, dan schema/migration terkait |
| Git commit | `CONVENTIONAL-COMMITS.md` |
| Changelog dan pekerjaan berikutnya | `CHANGELOG.md` |

AI tidak perlu membaca semua dokumen di `docs/` bila tidak relevan dengan permintaan pengguna.
