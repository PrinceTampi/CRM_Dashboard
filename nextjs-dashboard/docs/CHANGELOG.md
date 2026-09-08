# Changelog

Semua perubahan penting pada project dicatat di sini. Setiap entri harus menyertakan perubahan yang dilakukan dan to-do yang masih tersisa.

## 2026-09-08

### Dokumentasi proyek dan aturan AI

Perubahan:

- Menambahkan dokumentasi tech stack, core module, requirement developer, project structure, dan script di `docs/PROJECT-OVERVIEW.md`.
- Menambahkan indeks pembacaan dokumentasi AI di `docs/AI-DOCUMENTATION-INDEX.md`.
- Menambahkan pembatasan khusus Gemini dan agent lain di `docs/GEMINI-RESTRICTIONS.md`.
- Menambahkan standar Conventional Commits di `docs/CONVENTIONAL-COMMITS.md`.
- Menambahkan format changelog dan to-do berkelanjutan di dokumen ini.
- Menambahkan entrypoint `GEMINI.md` dan `.github/copilot-instructions.md` agar AI membaca indeks dokumentasi sebelum bekerja.
- Mempertahankan `docs/AI-RESTRICTIONS.md` dan `docs/copilot-instructions.md` sebagai aturan keamanan yang sudah ada.

Validasi:

- Dokumentasi dicocokkan dengan `package.json`, `prisma/schema.prisma`, struktur `app/`, `component/`, `lib/`, `query/`, dan `seed/`.
- Tidak ada source code atau database yang diubah.

To-do:

- [ ] Menetapkan versi minimum Node.js secara resmi di `package.json` atau dokumentasi release.
- [ ] Menambahkan script lint dan test jika kebutuhan kualitas proyek sudah ditentukan.
- [ ] Mengisi dokumentasi domain untuk setiap modul setelah alur bisnisnya final.
- [ ] Meninjau ulang dokumentasi ketika route atau dependency berubah.

## Template entri berikutnya

```markdown
## YYYY-MM-DD

### Judul perubahan

Perubahan:

- [ ] Jelaskan file atau perilaku yang berubah.

Validasi:

- [ ] Jelaskan command atau pemeriksaan yang dijalankan.

To-do:

- [ ] Catat pekerjaan lanjutan.
```
