# Conventional Commits

Repository ini menggunakan format **Conventional Commits** untuk pesan commit yang konsisten dan mudah dibaca oleh manusia maupun AI.

## Format

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

Contoh:

```text
feat(monitoring): add monthly CRM filter
fix(prisma): handle missing database client
chore(docs): add project overview
```

## Commit Types

| Type | Kapan digunakan |
| --- | --- |
| `feat` | Menambahkan kemampuan baru untuk pengguna |
| `fix` | Memperbaiki bug |
| `docs` | Mengubah dokumentasi saja |
| `style` | Perubahan format atau styling tanpa perubahan perilaku |
| `refactor` | Restrukturisasi kode tanpa perubahan fitur atau bug fix |
| `perf` | Meningkatkan performa |
| `test` | Menambah atau memperbaiki test |
| `build` | Perubahan build system atau dependency build |
| `ci` | Perubahan konfigurasi CI/CD |
| `chore` | Pemeliharaan lain yang tidak mengubah fitur aplikasi |
| `revert` | Membatalkan commit sebelumnya |

## Scope

Scope harus singkat dan menyebut area yang terdampak, misalnya:

- `monitoring`
- `input-ahass`
- `upload`
- `prisma`
- `docs`
- `ui`

Gunakan scope hanya jika membantu memperjelas perubahan.

## Breaking Changes

Tambahkan `!` setelah type atau footer `BREAKING CHANGE:` jika perubahan memutus kontrak yang sudah digunakan.

```text
feat(prisma)!: replace invoice status contract
```

Jelaskan dampaknya di body atau footer. Jangan menandai perubahan biasa sebagai breaking change.

## Rules

- Gunakan imperative mood: `add`, `fix`, `update`, bukan `added` atau `fixed`.
- Gunakan huruf kecil pada type, scope, dan description.
- Jangan akhiri subject dengan titik.
- Usahakan subject ringkas, idealnya maksimal 72 karakter.
- Satu commit sebaiknya mewakili satu tujuan logis.
- Jangan memasukkan secret, credential, data pelanggan, atau isi `.env` ke commit.
- AI tidak boleh membuat commit atau push tanpa permintaan eksplisit pengguna.

## Checklist Sebelum Commit

- [ ] Perubahan sesuai scope permintaan.
- [ ] Tidak ada file rahasia atau data sensitif.
- [ ] Validasi yang relevan sudah dijalankan.
- [ ] Changelog dan to-do diperbarui bila diperlukan.
- [ ] Pesan commit mengikuti format Conventional Commits.
