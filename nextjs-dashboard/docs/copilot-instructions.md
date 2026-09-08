# Instruksi Keamanan Perubahan AI

Sebelum bekerja, baca `AI-DOCUMENTATION-INDEX.md` terlebih dahulu. Setelah itu
baca hanya dokumen `docs/` yang sesuai dengan scope. Ikuti
`GEMINI-RESTRICTIONS.md` dan `AI-RESTRICTIONS.md` sebagai aturan wajib.

- Jangan mengubah data penting, database, Prisma schema/migration, seed, `.env`, atau konfigurasi produksi tanpa approval eksplisit pengguna.
- Jangan menghapus atau memindahkan file/folder tanpa permintaan eksplisit.
- Batasi perubahan pada file yang diperlukan untuk menyelesaikan permintaan.
- Jangan mengganti seluruh halaman atau melakukan refactor luas jika perubahan lokal sudah cukup.
- Jangan menjalankan operasi database yang bersifat tulis atau destruktif tanpa approval.
- Sebelum perubahan berisiko, jelaskan rencana dan minta persetujuan.
- Setelah perubahan, jalankan validasi terdekat dan laporkan hasilnya.
