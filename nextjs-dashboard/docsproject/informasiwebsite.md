## Keputusan Operasional Tambahan

### Monitoring

- Monitoring H1 berfokus pada jumlah ulang tahun bulan berjalan dan ulang tahun
	hari ini.
- Data Smart Birth dibaca dari file FU H1 yang diunggah pada akhir bulan.
- Conversion rate, sales contribution, total FU, dan metrik Smart Birth lain
	berasal dari hasil FU H1, bukan angka simulasi UI.
- H1, Smart Birth, dan Pengecekan R.O. memakai identitas customer yang sama.
- Identitas pencocokan diprioritaskan pada NIK, nomor mesin, dan nomor HP.
- Jika hanya nomor telepon berubah, customer/kendaraan yang sama tidak boleh
	dihitung sebagai R.O. baru.

### LCR

- Record LCR dikunci berdasarkan nomor mesin.
- Nomor mesin harus unik untuk satu motor dan menjadi kunci pencarian utama
	campaign LCR.

### Akses pengguna

- Halaman login wajib tampil sebelum halaman aplikasi.
- Role `ADMIN` dapat melihat seluruh halaman, menambah akun pengguna, dan
	mengatur role.
- Role `AHASS` hanya dapat melihat halaman Input AHASS.
- Akun demo development disediakan melalui environment variable dan seed,
	bukan password hardcode di source code.
Struktur halaman dan informasi tambahan

1.monitoring
2.pengecekan R.O
3.LCR
4.Ekspress H2
5.Smartbirth
6.report niguri
7.monitoring RCR
8.input Ahass


1.halaman monitoring
-Data H1 fokusnya pada tanggal ulang tahun (total ulang tahun bulan ini dan total ulang tahun hari ini)
-berapa banyak yang ulang tahun di tampilkan yang mengambil promo ulang tahun itu spreadshitnya di upload di akhir bulan jadi conversion rate/ sales contribution/ total follow up (FU)  dan lainnya akan baca spreadsheet FU H1 ini untuk halaman (SmartBirth) dan untuk pengecekan R.O jika misalkan data itu identik maka di KPI tidak tertambah R.O tetapi misalkan pelanggan 1 mengganti nomor telepon maka R.O di KPI akan bertambah tapi cuma di nomor telepon saja dan perhatikan patokan utama di file H1 adalah nomor telepon, KTP, nomor mesin intinya identitas yang sulit berubah tapi dapat di kenal dengan mudah jika berubah jadi data H1 itu terikat di 3 halaman website

2.halaman LCR
data di halaman ini di lock berdasarkan nomor mesin yang mana datanya unik untuk tiap motor

3.nanti sebelum masuk ke website harus di tambahkan halaman login yang mana berisi 2 role yang pertama itu admin dia bisa melihat semua halaman, menambah akun pengguna dan rolenya, lalu ada Ahass yang mana mereka cuma bisa melihat input Ahass
-buat ini jadi akun seed dan taruh di env sebagai akun demo passwordnya admin123 dan user123