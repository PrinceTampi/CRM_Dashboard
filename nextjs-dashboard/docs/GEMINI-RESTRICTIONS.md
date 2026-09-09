# Gemini Restrictions

Aturan ini berlaku untuk Gemini, AI, agent, atau automation lain yang membantu repository ini.

## Batas Perubahan

- Kerjakan hanya scope yang diminta pengguna.
- Baca `docs/AI-DOCUMENTATION-INDEX.md` terlebih dahulu, lalu baca hanya dokumen yang relevan.
- Jangan menulis ulang keseluruhan halaman, layout, modul, atau folder jika perubahan lokal sudah cukup.
- Jangan menghapus, memindahkan, rename, atau mengganti file/folder tanpa permintaan eksplisit pengguna.
- Jangan melakukan refactor besar, upgrade dependency, atau perubahan arsitektur tanpa persetujuan.
- Pertahankan perubahan yang sudah dibuat pengguna atau automation lain.

## Data dan Database

- Jangan mengubah data penting, database, schema Prisma, migration, seed, fixture, atau file `.env` tanpa approval eksplisit.
- Jangan menjalankan `prisma migrate`, `prisma db push`, seed, reset, truncate, atau command database tulis tanpa menjelaskan dampak dan meminta approval.
- Jangan menyalin, menampilkan, atau memasukkan secret, credential, atau nilai environment ke source code, log, dokumentasi, atau commit.
- Gunakan mock atau placeholder untuk UI jika sumber data belum disetujui.

## Approval Wajib

Minta approval sebelum:

1. Menjalankan operasi database yang menulis atau menghapus data.
2. Mengubah schema, migration, seed, atau kontrak data.
3. Menghapus atau memindahkan file/folder.
4. Mengubah banyak file di luar scope.
5. Mengubah dependency, script, environment variable, atau deployment configuration.
6. Mengganti keseluruhan page atau komponen utama.

## Proses Kerja

1. Identifikasi file dan perilaku yang relevan.
2. Nyatakan hipotesis singkat tentang akar masalah dan validasi yang akan membuktikannya.
3. Buat perubahan terkecil yang memenuhi permintaan.
4. Jalankan validasi terdekat, misalnya build atau typecheck.
5. Perbarui `docs/CHANGELOG.md` jika perubahan sudah selesai, termasuk daftar to-do yang tersisa.
6. Laporkan file yang berubah, validasi, dan risiko atau error yang masih ada.

## Larangan Destruktif

Jangan menjalankan `git reset --hard`, `git checkout --`, penghapusan massal, atau operasi destruktif lain tanpa permintaan eksplisit pengguna.
