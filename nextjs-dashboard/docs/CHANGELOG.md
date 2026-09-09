# Changelog

Semua perubahan penting pada project dicatat di sini. Setiap entri harus menyertakan perubahan yang dilakukan dan to-do yang masih tersisa.

## 2026-09-08

### Perbaikan freeze saat upload Excel

Perubahan:

- Memindahkan parsing workbook XLSX/XLS ke Web Worker.
- Menjaga halaman tetap responsif saat memproses file Excel besar.
- Menambahkan penanganan error worker dan fallback pesan yang jelas.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Perbaikan dev server dan upload Safari

Perubahan:

- Mengizinkan origin lokal `localhost` dan `127.0.0.1` untuk koneksi HMR Next.js.
- Membersihkan proses dev server lama yang menyebabkan bundle Safari tidak tersinkron.
- Memastikan halaman Upload berjalan dari folder project Next.js yang benar.

Validasi:

- `npm run build` berhasil.
- Dev server aktif pada port 3000 tanpa error HMR saat startup.

## 2026-09-08

### Perbaikan proses Upload Data

Perubahan:

- Menambahkan status `Memproses...` pada tombol Upload Data.
- File terpilih tidak lagi hilang ketika parsing gagal.
- Menambahkan dukungan variasi header H1 seperti Nama Konsumen, Nama Pelanggan, Nomor HP, dan Tanggal Faktur.
- Menampilkan pesan `Upload gagal: ...` dengan penyebab parser yang sebenarnya.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Perbaikan tombol pilih file Excel

Perubahan:

- Mereset nilai input file sebelum pemilihan agar file Excel yang sama dapat dipilih ulang.
- Menambahkan handler eksplisit untuk meneruskan file terpilih ke state upload.
- Menetapkan tombol upload sebagai `type="button"` agar tidak tertahan oleh perilaku submit browser.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Menampilkan hasil upload Excel

Perubahan:

- Menampilkan tabel `Data berhasil diupload` segera setelah file Excel diproses.
- Memisahkan hasil upload dan hasil integrasi agar status data terlihat jelas.
- Tombol `Jalankan Integrasi` aktif hanya setelah data berhasil terbaca.
- Menampilkan hasil integrasi pada tabel terpisah.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Perbaikan upload Excel yang gagal

Perubahan:

- Menambahkan validasi file kosong dan worksheet kosong.
- Memisahkan keberhasilan parsing/upload dari penyimpanan IndexedDB.
- Jika IndexedDB Safari gagal atau quota storage bermasalah, data tetap tampil dan dapat diintegrasikan selama halaman aktif.
- Pesan status sekarang menjelaskan apakah data berhasil diupload atau hanya penyimpanan lokal yang gagal.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Perbaikan filter data operasional

Perubahan:

- Tombol `Filter` pada Monitoring dan Pengecekan RO sekarang menerapkan kata kunci yang diketik.
- Tombol `Reset` mengosongkan kata kunci dan mengembalikan seluruh data.
- Tombol Enter pada input pencarian juga menerapkan filter.
- Filter cabang dan filter bulan tetap aktif sebagai filter data tambahan.

Validasi:

- `npm run build` berhasil.
- Kontrol Filter dan Reset diverifikasi pada route `/pengecekan-ro`.

## 2026-09-08

### Penyelesaian fungsi filter

Perubahan:

- Filter pencarian, tombol Filter, dan Reset pada Monitoring serta Pengecekan RO aktif.
- Dropdown cabang pada Monitoring sekarang memfilter antrean H1.
- Filter bulan ulang tahun pada Monitoring dan Smart Birth sekarang memfilter tabel berdasarkan bulan yang dipilih.
- Filter jenis data dan bulan pada Upload tetap digunakan untuk proses Excel.

Validasi:

- `npm run build` berhasil.
- Dropdown cabang Monitoring diverifikasi pada localhost dan tabel berubah sesuai cabang.

## 2026-09-08

### Menghubungkan upload H1 ke Pengecekan RO

Perubahan:

- Pengecekan RO sekarang membaca data H1 hasil upload dari IndexedDB.
- Pencarian nama pelanggan hasil upload, termasuk James Longdong, dapat menemukan data tersebut.
- Data upload lama dari localStorage juga dibaca sebagai fallback setelah perbaikan quota.
- Nomor mesin dipakai sebagai identitas sementara jika nomor RO belum tersedia, dengan status `Menunggu data`.

Validasi:

- `npm run build` berhasil.

## 2026-09-08

### Perbaikan quota upload Excel

Perubahan:

- Mengganti penyimpanan hasil upload dan integrasi dari `localStorage` ke IndexedDB.
- Menghilangkan penyebab `QuotaExceededError` saat file Excel berukuran besar atau memiliki banyak baris.
- Mempertahankan data upload dan integrasi saat berpindah halaman selama masih pada browser yang sama.

Validasi:

- `npm run build` berhasil.

Catatan:

- IndexedDB tetap merupakan penyimpanan lokal browser; untuk penyimpanan bersama antar-user diperlukan API/database.

## 2026-09-08

### Audit parity fungsi Next.js dengan CRM HTML

Perubahan:

- Mengaktifkan navigasi laporan dashboard, filter/reset antrean Monitoring dan Pengecekan RO, serta export Smart Birth.
- Menyamakan form Input AHASS dengan CRM HTML: nama konsumen, nomor HP, nomor mesin, lokasi event, catatan, simpan, dan reset.
- Mempertahankan upload Excel dan hasil integrasi saat berpindah halaman melalui localStorage browser.

Validasi:

- `npm run build` berhasil.
- Route dashboard, monitoring, input AHASS, upload, pengecekan RO, dan Smart Birth berhasil dikompilasi.

Catatan parity:

- HTML CRM memiliki modul tambahan EKSPRES H2, Niguri H3, dan Monitoring RCR yang belum memiliki route Next.js.
- Persistence database/API belum diaktifkan; perilaku data baru berjalan lokal seperti state client.

## 2026-09-08

### Mengaktifkan aksi halaman CRM

Perubahan:

- Menghubungkan `Ekspor laporan` Monitoring ke download CSV data ulang tahun terpilih.
- Menghubungkan `Simpan draft` Input AHASS ke penyimpanan draft lokal browser dan feedback sukses.
- Menghubungkan `Buat pengecekan` Pengecekan RO ke pembuatan status draft pengecekan dan feedback di halaman.
- Menjaga API dan database tetap tidak tersentuh.

Validasi:

- `npm run build` berhasil.
- Feedback `Draft AHASS tersimpan di browser` diverifikasi pada localhost.

Catatan:

- Penyimpanan dan pembuatan draft saat ini bersifat lokal karena endpoint persistence belum tersedia.

## 2026-09-08

### Penyederhanaan kontrol upload

Perubahan:

- Menggabungkan tombol upload menjadi satu tombol `Upload Data`.
- Jenis proses H1, H2, H3, dan BFU sekarang dipilih melalui satu dropdown.
- Merapikan proporsi, jarak, hint, dan hierarki kontrol upload agar lebih profesional.
- Mempertahankan parser Excel, riwayat upload, integrasi, deduplikasi, dan download CSV.

Validasi:

- `npm run build` berhasil.
- Halaman `/upload` diverifikasi pada localhost.

## 2026-09-08

### Penyelarasan Upload & Integrasi dengan CRM HTML

Perubahan:

- Mengubah halaman Next.js menjadi upload Excel-only (`.xlsx` dan `.xls`) seperti file CRM asli.
- Menambahkan pilihan jenis data H1, H2, H3, dan BFU serta bulan data.
- Menambahkan aksi Upload, Upload FU H2, Upload FU H3, riwayat upload, dan pesan validasi.
- Menambahkan integrasi lokal dengan deduplikasi berdasarkan nama dan nomor HP.
- Menambahkan statistik total data terintegrasi, sumber data terupload, duplikat, tabel hasil, dan Download CSV.

Validasi:

- `npm run build` berhasil.
- Halaman `/upload` diverifikasi pada localhost.

Catatan:

- Integrasi berjalan di browser seperti HTML asli dan belum menulis ke database/API.

## 2026-09-08

### Dukungan upload XLSX

Perubahan:

- Menambahkan dependency `xlsx` untuk membaca workbook Excel di browser.
- Upload sekarang menerima file `.xlsx` dan `.csv`.
- Worksheet pertama diproses, header H1 divalidasi, dan baris data ditampilkan pada preview.

Validasi:

- `npm run build` berhasil.

Catatan:

- Upload masih berupa preview lokal dan belum menulis data ke database.

## 2026-09-08

### Upload data dummy lokal

Perubahan:

- Menambahkan upload CSV dummy pada halaman Upload.
- Menambahkan validasi header H1 dan preview maksimal delapan baris setelah file dipilih.
- Menambahkan template contoh `public/dummy-h1.csv` yang dapat diunduh dan diunggah kembali.
- Menjaga proses tetap lokal di browser; tidak ada penulisan ke database.

Validasi:

- `npm run build` berhasil.
- Halaman Upload diverifikasi pada localhost.

To-do:

- [ ] Hubungkan hasil upload ke API persistence setelah endpoint dan kontrak data disetujui.

## 2026-09-08

### Monitoring ulang tahun dan integrasi data

Perubahan:

- Menambahkan filter bulan ulang tahun berbasis waktu real-time pada Monitoring.
- Menampilkan total konsumen, ulang tahun hari ini, dan total ulang tahun pada bulan terpilih.
- Menambahkan tabel nama, tanggal lahir, usia, nomor HP, tanggal faktur, email, dan status.
- Menambahkan download CSV dan PDF untuk data ulang tahun.
- Menambahkan panel integrasi data; tombol CSV/PDF aktif setelah integrasi dijalankan.

Validasi:

- `npm run build` berhasil.
- Monitoring diverifikasi pada localhost dengan filter September 2026 dan alur integrasi.

Catatan:

- XLSX valid belum ditambahkan karena dependency `xlsx` tidak disetujui; CSV dapat dibuka langsung di Excel.

## 2026-09-08

### Mengembalikan panel integrasi dashboard

Perubahan:

- Mengembalikan panel `Integrasi Data` pada dashboard awal.
- Menambahkan kembali aksi `Jalankan Integrasi` dan `Download CSV` sesuai HTML awal.
- Tidak mengubah route, data, business logic, atau bagian dashboard lain.

Validasi:

- `npm run build` berhasil.
- Panel diverifikasi pada `http://localhost:3000/dashboard`.

## 2026-09-08

### Aksi integrasi H1 dan export CSV

Perubahan:

- Menambahkan link `Integrasikan H1` pada panel Upload menuju pusat data Smart Birth.
- Menambahkan `Download CSV` pada Smart Birth dengan export data H1 beserta tanggal lahir, tanggal faktur, email, nomor RO, AHASS, dan status.

Validasi:

- `npm run build` berhasil.
- Aksi dan kolom CSV diverifikasi pada route `/smartbirth` dan `/upload` di localhost.

To-do:

- [ ] Menghubungkan integrasi H1 ke proses upload/API nyata setelah kontrak endpoint disetujui.

## 2026-09-08

### Redesign UI enterprise CRM

Perubahan:

- Memoles visual layer CRM dengan identitas corporate Honda-inspired: deep navy, Honda red sebagai aksen, cool gray canvas, dan Inter sebagai font utama.
- Merapikan sidebar, header, page heading, KPI cards, panel prioritas, data H1, activity log, form, filter, tabel, dan responsive layout.
- Mengurangi dekorasi, rounded card, shadow, dan penggunaan warna berlebihan tanpa mengubah route, data, business logic, atau integrasi.

Validasi:

- `npm run build` berhasil.
- Dashboard diverifikasi pada `http://localhost:3000/dashboard`.

To-do:

- [ ] Menambahkan visual regression test jika kebutuhan QA frontend sudah ditentukan.

## 2026-09-08

### Integrasi data H1 ke monitoring dan Smart Birth

Perubahan:

- Menghapus grafik aktivitas/penjualan bulanan dari dashboard.
- Menambahkan sumber data H1 bersama di `ui/crm/h1-data.ts` untuk dipakai dashboard, monitoring, pengecekan RO, dan Smart Birth.
- Menambahkan route `/smartbirth` dengan kolom tanggal lahir, tanggal faktur, dan email pelanggan.
- Menambahkan Smart Birth ke navigasi utama.

Validasi:

- `npm run build` berhasil.
- 10 route App Router berhasil dikompilasi dan diprerender.

To-do:

- [ ] Hubungkan `h1Records` ke API atau Prisma setelah kontrak data input H1 disetujui.

## 2026-09-08

### Penyelarasan UI CRM dari HTML awal

Perubahan:

- Menerapkan sistem visual dari HTML awal ke seluruh route CRM melalui stylesheet global: sidebar navy, aksen merah, header, kartu metrik, panel, tabel, form, upload, dan responsive layout.
- Menambahkan state hover, focus, status, serta breakpoint mobile untuk dashboard, monitoring, input AHASS, upload, pengecekan RO, dan portal monitoring.
- Menyesuaikan PostCSS ke plugin Tailwind 4 yang sudah tersedia.
- Menghapus opsi `baseUrl` yang tidak lagi didukung TypeScript 7 dan menghasilkan Prisma Client lokal tanpa mengubah schema atau database.

Validasi:

- `npm run build` berhasil.
- Semua route App Router berhasil dikompilasi dan diprerender.

To-do:

- [ ] Mengganti data statis dengan data API/Prisma ketika kontrak bisnis dan sumber data sudah final.
- [ ] Menambahkan pengujian interaksi browser untuk form dan upload.

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
