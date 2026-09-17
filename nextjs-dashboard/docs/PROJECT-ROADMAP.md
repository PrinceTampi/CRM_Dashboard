# Project Roadmap

## 1. Tujuan proyek

Membangun dashboard CRM internal yang terintegrasi, konsisten, dan mudah dikelola oleh developer. Fokus utama adalah data bisnis yang valid, pengalaman pengguna yang stabil, dan struktur kode yang mudah dirawat.

## 2. Prinsip utama pengembangan

- Struktur folder dan file harus jelas dan konsisten
- Komponen harus dipisahkan menurut fungsi dan concern
- Data API harus terpusat dan tidak tersebar di UI
- Validasi dan error handling harus standar untuk semua fitur
- Penamaan bahasa dan istilah harus konsisten agar mudah dibaca developer
- Versi aplikasi harus terdokumentasi dan tampilkan notifikasi saat update

## 3. Roadmap prioritas

### Fase 1 — Stabilitas foundational

Tujuan: memastikan semua fitur utama berjalan dengan aman dan rapi.

- Audit route dan screen aktif
- Pastikan semua layar memiliki state loading, empty, dan error
- Menjaga Prisma schema sebagai single source of truth
- Memastikan auth, session, dan permission konsisten
- Menghapus sisa data dummy yang masih aktif tanpa disengaja

Checklist:
- [ ] audit seluruh halaman utama
- [ ] cek semua API response dan fallback
- [ ] validasi login dan session
- [ ] review semua data source aktif

### Fase 2 — Refactor struktur komponen

Tujuan: memecah komponen besar agar lebih mudah dibaca dan dipelihara.

- Pisahkan presentational component dan feature logic
- Gunakan hook untuk fetching dan state kompleks
- Menyederhanakan inline style dan markup yang terlalu panjang
- Menyamakan naming dan pola penulisan antar komponen

Checklist:
- [ ] review komponen besar seperti upload dan monitoring
- [ ] pisahkan data fetching dari JSX
- [ ] buat komponen kecil yang reusable
- [ ] standardisasi naming

### Fase 3 — Standarisasi bahasa dan developer experience

Tujuan: memudahkan tim membaca dan mengembangkan project.

- Konsisten dalam penamaan folder dan file
- Gunakan nama komponen yang jelas dan deskriptif
- Gunakan istilah bisnis yang seragam di seluruh UI
- Buat dokumentasi penamaan untuk developer

Checklist:
- [ ] dokumen naming standard dibuat
- [ ] review label UI dan status data
- [ ] konsistensi istilah fitur (FU, follow-up, monitoring, upload)
- [ ] review folder dan file yang masih ambigu

### Fase 4 — Business rules dan validasi data

Tujuan: memastikan data yang masuk sesuai kebutuhan bisnis.

- Validasi input wajib di semua form penting
- Normalisasi data antar sumber
- Deduplicate dan mapping data dari berbagai import
- Menyusun log status import dan history upload

Checklist:
- [ ] validasi form AHASS
- [ ] validasi import Excel/CSV
- [ ] validasi data LCR, H1/H2/H3
- [ ] review duplication dan consistency

### Fase 5 — UX dan pengalaman pengguna

Tujuan: aplikasi lebih profesional dan mudah dipakai.

- Loading state konsisten di semua form dan dashboard
- Empty state dan error state yang jelas
- Notifikasi update dan feedback pengguna yang jelas
- Export CSV dan filter lebih konsisten

Checklist:
- [ ] konsistensi loading state
- [ ] konsistensi empty state
- [ ] feedback untuk error/success
- [ ] review flow aksi penting

### Fase 6 — Testing dan deployment

Tujuan: project siap untuk tumbuh dan dipelihara dengan lebih aman.

- Unit test untuk helper dan parser data
- Test untuk import pipeline dan validation
- Smoke test untuk route utama
- Checklist deployment production
- monitoring dan logs untuk release berikutnya

Checklist:
- [ ] test helper penting
- [ ] test API utama
- [ ] test import data
- [ ] review config environment production

## 4. Prioritas implementasi saat ini

1. Refactor komponen besar
2. Standardisasi naming dan bahasa
3. Pembersihan struktur UI yang terlalu menempel ke HTML
4. Konsistensi state dan error handling
5. Review fitur utama dan data flow
6. Persiapan QA dan release

## 5. Target milestone

### Milestone 1 — Stabil
- semua halaman basic berfungsi dengan data valid
- loading/error/fallback konsisten
- tidak ada data dummy tersembunyi yang aktif

### Milestone 2 — Maintainable
- komponen lebih modular dan mudah dibaca
- project lebih konsisten untuk developer
- struktur folder sesuai standar yang disepakati

### Milestone 3 — Production-ready
- validasi kuat dan error handlings siap
- deployment checklist lengkap
- aplikasi lebih siap untuk pertumbuhan fitur berikutnya

## 6. Catatan untuk eksekusi

Tahap berikutnya akan fokus pada:
- refactor komponen besar
- pemisahan logika dan view
- standardisasi bahasa dan naming
- pengecekan ulang struktur folder
- persiapan parade fitur inti agar lebih scalable
