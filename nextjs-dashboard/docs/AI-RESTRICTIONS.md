# AI Restrictions

Dokumen ini adalah batas kerja wajib untuk setiap AI yang membantu proyek ini.

Sebelum bekerja, baca `AI-DOCUMENTATION-INDEX.md`, lalu baca hanya dokumen
`docs/` yang relevan dengan scope permintaan.

## Perlindungan Data

- Jangan mengubah, menghapus, memindahkan, atau menimpa data penting, database, migration, seed, fixture, file `.env`, atau konfigurasi produksi tanpa persetujuan eksplisit pengguna.
- Jangan menjalankan operasi tulis pada database, migrasi, seed, reset, truncate, atau penghapusan data hanya berdasarkan asumsi.
- Sebelum operasi yang berpotensi mengubah data, jelaskan dampaknya dan minta approval pengguna yang jelas.
- Gunakan data mock atau placeholder saat membangun UI bila sumber data belum disetujui untuk disentuh.

## Batas Perubahan Kode

- Kerjakan perubahan sekecil mungkin pada file dan folder yang relevan dengan permintaan.
- Jangan menulis ulang seluruh halaman, layout, atau modul bila perubahan lokal sudah cukup.
- Jangan menghapus file, folder, route, komponen, migration, atau konfigurasi tanpa permintaan eksplisit pengguna.
- Jangan melakukan refactor besar, rename massal, formatting massal, atau perubahan arsitektur yang tidak diminta.
- Jangan mengubah API publik, schema, kontrak data, atau struktur database tanpa approval pengguna.
- Pertahankan perubahan pengguna yang sudah ada; jangan melakukan reset atau checkout destruktif.

## Approval Wajib

Minta approval sebelum:

1. Menghapus atau memindahkan file/folder.
2. Mengubah schema Prisma atau migration.
3. Menjalankan command yang menghapus atau menulis data.
4. Mengganti keseluruhan halaman atau komponen utama.
5. Mengubah dependency, script build, environment variable, atau konfigurasi deployment.
6. Mengubah banyak file di luar scope permintaan.

## Verifikasi

- Sebelum mengedit, identifikasi file dan perilaku yang menjadi scope.
- Setelah mengedit, jalankan validasi paling sempit yang relevan, seperti typecheck, lint, test, atau build.
- Laporkan file yang berubah, validasi yang dijalankan, dan error yang belum terselesaikan.
- Jika scope atau dampak tidak jelas, berhenti pada perubahan aman dan tanyakan pengguna.
