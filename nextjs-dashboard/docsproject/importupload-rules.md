# SOP Import dan Ingesti CRM

Status: transkripsi terstruktur dari `STANDAR OPERASIONAL PROSEDUR & SPESIFIKASI TEKNIS.pdf`, versi 2.0.

## Pipeline umum

```text
Workbook -> validasi sheet/header -> normalisasi -> validasi baris
-> staging/import rows -> upsert domain -> audit summary
```

Satu workbook dapat memiliki banyak sheet. Setiap sheet diproses dengan
kontraknya sendiri dan menyimpan nama sheet serta nomor baris sumber.

## H1, sheet `H1`

### Header wajib

`Kode Dealer`, `Tanggal Faktur`, `Nama Konsumen`, `No KTP`, `Nomor Mesin`,
`Nomor Rangka`, dan `Tipe dan Warna`.

### Transformasi

- Nomor telepon: hapus karakter non-digit; awalan `08` dikonversi ke `628`.
- Tanggal faktur, lahir, dan mohon: ISO `YYYY-MM-DD`.
- Nomor mesin/rangka: uppercase dan hapus seluruh spasi internal.
- Customer: cari berdasarkan No KTP; update profil jika ada, buat customer baru
	jika tidak ada.
- Kendaraan: map kombinasi nomor mesin + rangka ke master kendaraan.
- Jika RING kosong, hitung dari referensi kelurahan/kecamatan.
- Data terverifikasi disimpan sebagai transaksi H1.

## H23 gabungan H2 dan H3, sheet `Data`

### Header wajib

`Inv No`, `Tgl Invoice`, `Cust Name`, `Ref No`, `Item No`, `Qty`, `Price`,
`Nosin`, dan `Noka`.

### Transformasi

- Trim dan uppercase pada invoice, WO, item, Nosin, Noka, dan NoPol.
- Cocokkan Nosin + Noka ke master kendaraan.
- Jika kendaraan belum ada, buat profil kendaraan pasif untuk proses review.
- Hitung ulang `Gross Amt = Qty * Price`.
- `disc_rate` disimpan sebagai rasio desimal; `0.25` berarti 25%.
- Hitung `Disc Amt = Gross Amt * Disc Rate`.
- Map Group Part ke master kategori; nilai tidak dikenal disimpan dengan status
	`UNKNOWN_GROUP` dan warning.
- Simpan header invoice/WO terpisah dari line items.
- Routing domain: `SERVICE` menjadi detail H2; `PART` dan `PARTSERVICE`
	menjadi detail H3.
- Jenis transaksi selain tiga nilai tersebut ditolak sebagai
	`UNKNOWN_TRANSACTION_TYPE`.
- Duplikasi kombinasi `Inv No + Item No`: strategi `Last-Win`, ambil baris
	terakhir dan catat alert duplikasi.

## LCR MSJ, sheet `Sheet1`

File: `LCR MSJ.xlsx`.

- Kolom mesin/rangka muncul dua kali pada sumber; parser wajib membedakan
	pasangan kolom pertama sebagai identifier utama dan pasangan kedua sebagai
	nilai referensi/hasil mapping.
- Field utama: `Nomor Mesin`, `Nomor Rangka`, `or Rangka`, status treatment,
	tipe motor, tanggal faktur, customer, kontak, alamat, dealer asal, dealer
	pelaksana, ring, tipe detail, dan sales.
- Status `Sudah LCR` mengatur `is_treated = true`; baris lain masuk antrean
	campaign aktif.

## DataProspek, sheet `PROSPEK`

File: `DataProspek (34) (2).xlsx`.

- `ID Leads` adalah identifier pipeline prospek dan harus dipertahankan.
- `ID Guestbook` menjadi identifier sumber event/guestbook jika tersedia.
- Simpan atribut funnel: channel, event, platform, lead time, SLA, status
	assignment, status FU, contact status, media kontak, next follow-up, tipe
	prospek, tipe customer, pembayaran, sales force, dealer, dan status akhir.
- DataProspek adalah pipeline prospek; jangan langsung diperlakukan sebagai
	transaksi H1/H23 atau lead H3 Activate tanpa aturan sinkronisasi ID.

## H3 Activate dan Master LoV aktual

File: `H3_Activate_15012_2026-09-15.xlsx` memiliki sheet data utama
`15012_Activate_2026-09-15` dan sheet `Master LoV`. Sheet Master LoV menjadi
sumber validasi status kontak dan alasan Not Deal.

## LCR, sheet `Sheet1`

- Nomor mesin dan rangka wajib ada, uppercase, tanpa spasi.
- Nilai pengerjaan positif seperti `Sudah LCR` mengatur `is_treated = true`.
- Data yang belum dikerjakan masuk antrean aktif campaign.

## H3 Activate, multi-sheet dan Master LoV

- ID lead wajib ada dan tidak boleh dimodifikasi atau dipindahkan.
- Status Contact dan Alasan Not Deal dicocokkan ke sheet Master LoV.
- Sinkronisasi status dan histori dilakukan berdasarkan ID lead.
- Nilai LoV yang belum dikenal tetap disimpan sebagai `UNMAPPED` dan
	menghasilkan notifikasi admin.

## Niguri report

- Matriks multi-header di-unpivot menjadi baris relasional.
- Persentase berbasis teks diubah ke decimal presisi tinggi.
- Snapshot bulanan di-upsert berdasarkan periode, dealer, pipeline, dan
	kategori report.

## Matriks error

| Skenario | Level | Tindakan |
| --- | --- | --- |
| Mesin/rangka kosong | ERROR | Tolak baris, batalkan insert, simpan log |
| Header wajib hilang | FATAL_ERROR | Abort seluruh batch |
| Tanggal invalid | ERROR | Tolak baris, simpan nomor baris dan raw content |
| ID H3 kosong | ERROR | Tolak update dan kunci integritas lead |
| Nilai LoV tidak dikenal | WARNING | Simpan sebagai `UNMAPPED`, notifikasi admin |
| Nomor HP kurang/salah | WARNING | Simpan, `is_contact_valid = false`, lewati blast WA |
| Duplikat H23 | WARNING | Last-Win dan catat alert |

## Audit import

Setiap batch minimal menyimpan:

- `file_name`
- `import_timestamp`
- `total_rows_processed`
- `successful_rows`
- `failed_rows`
- `warning_rows`
- daftar `error_logs`

Setiap error log minimal memiliki `row_number`, `field_name`, `error_code`,
`raw_value`, dan `system_action`.
