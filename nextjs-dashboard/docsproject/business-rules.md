# CRM Business Rules

Status: transkripsi terstruktur dari `BUSINESS-RULES.pdf`, versi 1.0.

## 1. Identitas dan deduplikasi

### Kendaraan

- Kombinasi `nomor_rangka` + `nomor_mesin` adalah identitas unik kendaraan.
- H2/H3 dengan kombinasi yang sama harus terhubung ke kendaraan yang ada.
- `nopol` boleh berubah tanpa mengubah identitas kendaraan.

### Customer

- `no_ktp`/NIK unik per individu pada transaksi H1.
- Variasi minor nama dengan NIK sama di-match ke customer yang sama dan nama
	baru dicatat sebagai alias.
- Nomor HP sama dengan NIK dan nama berbeda tidak boleh auto-merge; tandai
	`Potential Duplicate` untuk verifikasi manual.
- Status kontak invalid menghentikan broadcast otomatis dan menandai kontak
	sebagai `Unreachable`/`Invalid Contact`.

## 2. H1: penjualan unit

- Untuk `jenis_bayar = KREDIT`, validasi `kode_leasing`, `tenor`, `uang_muka`,
	`cicilan_verifikasi`, `tenor_verifikasi`, dan `uang_muka_verifikasi`.
- Status verifikasi kredit: `FINISH - VALID`, `FINISH - TIDAK VALID`,
	`NO RESPONSE`, atau `TIDAK DAPAT DIHUBUNGI`.
- Untuk `jenis_bayar = TUNAI`, field leasing dan verifikasi kredit menjadi
	`NULL`/`NOT APPLICABLE`.
- Jika `ring` kosong, sistem menghitungnya dari mapping kelurahan, kecamatan,
	kota, dan lokasi dealer.
- Setiap faktur harus konsisten menyimpan kode sales force, nama sales force,
	dan nama sales.

## 3. H23: workbook H2 dan H3

- Satu `inv_no` terikat ke satu `ref_no`/WO.
- H2 hanya menerima `jenis_transaksi = SERVICE`.
- H3 menerima `jenis_transaksi = PART` atau `PARTSERVICE`.
- Satu invoice/WO dapat memiliki banyak line item, tetapi setiap line item
	hanya masuk ke satu domain berdasarkan `jenis_transaksi`.
- `gross_amt = qty * price`.
- `net_amt = gross_amt - disc_amt`.
- `disc_rate` disimpan sebagai rasio desimal; contoh `0.25` berarti diskon 25%.
- Jika `disc_rate` tersedia, `disc_amt = gross_amt * disc_rate`.
- `group_part` wajib dipetakan ke: MESIN, OLI, ACCS, RANGKA, BUSI,
	KELISTRIKAN, RUBBER, BEARING, PLASTIK, atau FRAME.
- Transaksi service wajib memiliki SA ID, nama SA, dan nama mekanik jika data
	sumber mendukungnya.

## 4. LCR campaign

- Cocokkan kendaraan berdasarkan Noka/Nosin dengan master campaign LCR.
- Jika treatment selesai, set status menjadi `Sudah LCR` dan `is_treated = true`.
- Kendaraan yang sudah `Sudah LCR` tidak boleh diajukan ulang untuk campaign
	yang sama secara otomatis.

## 5. H3 Activate dan Master LoV

- ID lead adalah primary key absolut; tidak boleh diubah, digeser, di-reset,
	atau dikosongkan saat import/export.
- `source_data` wajib membedakan `H1 to H3` dan `H2 to H3`.
- Hierarki sumber/platform harus membedakan DEALER (H3) dan HC3-MD (H3).
- `status_contact` dan `alasan_not_deal` harus berasal dari Master LoV.
- Jika status prospek menjadi `Not Deal`, alasan wajib salah satu dari:
	`Tidak tertarik`, `Sudah membeli di outlet parts`, `Not in purpose (Iseng)`,
	`Tidak ada budget`, `Sudah Membeli`, `Parts Tidak Ready`, atau `Lain-lain`.
- Saat FU disimpan, set `identify_has_fu = YA` dan kunci `waktu_follow_up`.

## 6. Master LoV status kontak

Kategori yang harus dipertahankan sebagai nilai master:

- Telepon terhubung: `Telp Terhubung`, `TELP TERHUBUNG`, dan konsumen sibuk
	setelah telepon diangkat.
- Gagal telepon: salah sambung, nomor salah/tidak aktif/tidak terdaftar,
	tidak dapat dihubungi, mailbox, dialihkan, sibuk, tidak diangkat,
	dimatikan, atau di luar jangkauan.
- Pesan digital: WA/SMS terkirim dan dibalas, terkirim tetapi belum dibalas,
	tidak terkirim, atau tidak terdaftar.
- Kunjungan fisik: ketemu, alamat salah, pindah rumah, tidak ada konsumen,
	atau konsumen tidak mau ditemui.

## 7. Niguri analytics

- H1 membagi customer menjadi: H1 hanya beli, beli dan service di dealer
	sendiri, serta hanya service di dealer lain.
- Prospek yang belum selesai pada M-1 menjadi `workload_m_minus_1` pada M.
- Ketidaktercapaian diklasifikasikan sebagai `unreachable`, `rejected`, atau
	`workload`.
- Rasio sent/failed dan contacted rate dihitung ulang per bulan.
