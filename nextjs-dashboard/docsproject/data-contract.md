# CRM Data Contract

Status: transkripsi terstruktur dari `CRM_Data_Contract_Specification.pdf`.
Versi sumber: spesifikasi H1, H23, H3 Activate, LCR, Niguri H1, dan Niguri H3.

Dokumen ini mendefinisikan nama field, tipe, kewajiban, dan arti data. Aturan
proses serta perlakuan error ada di `business-rules.md` dan
`importupload-rules.md`.

## Konvensi

- `String`: simpan sebagai teks, termasuk nomor telepon, NIK, kode dealer, dan
	nomor kendaraan agar leading zero tidak hilang.
- `Integer`: bilangan bulat.
- `Decimal`: nominal uang atau rasio yang membutuhkan presisi.
- `Date`: tanggal kalender tanpa waktu.
- `DateTime`: tanggal dan waktu dengan zona waktu yang disepakati sistem.
- Field `Wajib = Ya` harus tersedia setelah normalisasi; jika tidak, baris atau
	batch ditolak sesuai aturan import.

## H1: Penjualan Unit Motor Baru

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `no` | Integer | Ya | Nomor urut sumber |
| `kode_dealer` | String | Ya | Kode dealer penjual |
| `tanggal_faktur` | Date | Ya | Tanggal faktur |
| `nama_konsumen` | String | Ya | Nama pembeli |
| `no_ktp` | String | Ya | KTP/NIK konsumen |
| `tanggal_lahir` | Date | Tidak | Tanggal lahir |
| `no_hp` | String | Ya | Nomor telepon genggam |
| `no_telp` | String | Tidak | Telepon alternatif |
| `jenis_kelamin` | String | Tidak | Pria/Wanita |
| `agama` | String | Tidak | Agama |
| `pekerjaan` | String | Tidak | Pekerjaan |
| `motor_sebelum` | String | Tidak | Motor sebelumnya |
| `pendidikan` | String | Tidak | Pendidikan terakhir |
| `jenis_jual` | String | Tidak | Kode jenis penjualan |
| `jenis_bayar` | String | Ya | CASH/KREDIT |
| `jenis_skr` | String | Tidak | Segmen motor |
| `pengeluaran` | String | Tidak | Rentang pengeluaran |
| `digunakan` | String | Tidak | Tujuan penggunaan |
| `pemakai` | String | Tidak | Pengguna utama |
| `nomor_mesin` | String | Ya | Identitas mesin/kendaraan |
| `nomor_rangka` | String | Ya | VIN/rangka kendaraan |
| `tipe_dan_warna` | String | Ya | Tipe dan warna |
| `kode_leasing` | String | Tidak | Lembaga pembiayaan |
| `tenor` | Integer | Tidak | Tenor kredit dalam bulan |
| `uang_muka` | Integer | Tidak | Nominal DP |
| `alamat` | String | Tidak | Alamat konsumen |
| `kelurahan` | String | Tidak | Kelurahan |
| `kecamatan` | String | Tidak | Kecamatan |
| `kota` | String | Tidak | Kota/kabupaten |
| `kodepos` | String | Tidak | Kode pos |
| `email` | String | Tidak | Email |
| `verifikasi_pekerjaan` | String | Tidak | Status verifikasi pekerjaan |
| `verifikasi_email` | String | Tidak | Status verifikasi email |
| `kode_sales_force` | String | Tidak | Kode sales force |
| `sales_force` | String | Tidak | Nama tim sales force |
| `status_faktur` | String | Tidak | Status faktur |
| `status_verifikasi` | String | Tidak | Status verifikasi data/kredit |
| `keterangan_hp` | String | Tidak | Catatan validitas HP |
| `tanggal_mohon` | Date | Tidak | Tanggal pengajuan |
| `cara_beli` | String | Tidak | Skema pembelian |
| `uang_muka_verifikasi` | Integer | Tidak | DP hasil verifikasi |
| `tenor_verifikasi` | Integer | Tidak | Tenor hasil verifikasi |
| `cicilan_verifikasi` | Integer | Tidak | Cicilan hasil verifikasi |
| `total_diskon` | Integer | Tidak | Total diskon |
| `no_kk` | String | Tidak | Nomor KK |
| `ring` | String | Tidak | Klasifikasi wilayah |
| `nama_sales` | String | Tidak | Nama petugas sales |

## H23: Workbook gabungan H2 dan H3

H23 adalah satu workbook gabungan. Satu `inv_no` terikat pada satu `ref_no`/WO
dan dapat memiliki banyak baris item. Routing domain berdasarkan
`jenis_transaksi`:

- H2 hanya menggunakan `SERVICE`.
- H3 menggunakan `PART` dan `PARTSERVICE`.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `inv_no` | String | Ya | Nomor invoice |
| `tgl_invoice` | Date | Ya | Tanggal transaksi |
| `cust_name` | String | Ya | Nama pelanggan |
| `ref_no` | String | Ya | Nomor Work Order |
| `item_no` | String | Ya | Kode item |
| `item_desc` | String | Ya | Deskripsi item |
| `qty` | Integer | Ya | Kuantitas |
| `price` | Integer | Ya | Harga satuan |
| `gross_amt` | Integer | Ya | Nilai kotor |
| `disc_rate` | Float | Tidak | Persentase diskon |
| `disc_amt` | Integer | Tidak | Nominal diskon |
| `marketplace` | String | Tidak | Platform online |
| `mechanic_name` | String | Tidak | Mekanik |
| `vehicle_model` | String | Tidak | Model kendaraan |
| `vehicle_group` | String | Tidak | MATIC/CUB/SPORT |
| `nopol` | String | Tidak | Nomor polisi |
| `noka` | String | Tidak | Nomor rangka |
| `nosin` | String | Tidak | Nomor mesin |
| `asm_year` | Integer | Tidak | Tahun perakitan |
| `jenis_transaksi` | String | Ya | `SERVICE` untuk H2; `PART` atau `PARTSERVICE` untuk H3 |
| `dealer_name` | String | Ya | AHASS/dealer pelaksana |
| `alamat` | String | Tidak | Alamat pemilik |
| `no_hp` | String | Tidak | Nomor HP |
| `kecamatan` | String | Tidak | Kecamatan |
| `kelurahan` | String | Tidak | Kelurahan |
| `kota` | String | Tidak | Kota/kabupaten |
| `group_part` | String | Tidak | Kategori part |
| `sa_id` | Integer | Tidak | ID Service Advisor |
| `nama_sa` | String | Tidak | Nama Service Advisor |

## H3 Activate: Campaign Follow-up

`id` adalah identifier lead yang tidak boleh diubah saat import/export.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | Integer | Ya | Primary key lead |
| `waktu_upload` | DateTime | Ya | Waktu upload |
| `waktu_assign` | DateTime | Tidak | Waktu assignment dealer |
| `nama` | String | Ya | Nama target |
| `platform_data` | String | Tidak | Platform sumber |
| `source_data` | String | Ya | H1 to H3/H2 to H3 |
| `cms_source` | String | Tidak | Kategori CMS |
| `no_hp` | String | Ya | HP target |
| `no_telp` | String | Tidak | Telepon alternatif |
| `dealer_sebelumnya` | String | Tidak | Dealer sebelumnya |
| `md` | String | Ya | Kode Main Dealer |
| `assigned_dealer` | String | Ya | Kode dealer tujuan |
| `alamat` | String | Tidak | Alamat |
| `waktu_follow_up` | DateTime | Tidak | Waktu FU |
| `contact_by` | String | Tidak | WA/Telp |
| `status_contact` | String | Tidak | Status kontak dari Master LoV |
| `lebel_contact` | String | Tidak | CONTACTED/UNCONTACTED |
| `progress_fu` | String | Tidak | NotDeal/Prospect/Deal |
| `prospect_status` | String | Tidak | Status prospek |
| `jenis_parts_prospek` | String | Tidak | Kategori part minat |
| `parts_prospek` | String | Tidak | Kode part minat |
| `qty_prospek_first` | Integer | Tidak | Qty prospek awal |
| `tanggal_next_follow_up` | Date | Tidak | Jadwal FU berikut |
| `next_action_keterangan_fu` | String | Tidak | Rencana aksi |
| `alasan_not_deal` | String | Tidak | Alasan Not Deal dari LoV |
| `jenis_parts_deal` | String | Tidak | Kategori part deal |
| `parts_deal_first` | String | Tidak | Kode part deal |
| `qty_deal_first` | Integer | Tidak | Qty deal |
| `metode_pembayaran` | String | Tidak | Metode pembayaran |
| `prospect_pending` | Integer | Tidak | Flag pending |
| `prospect_hlo` | Integer | Tidak | Flag HLO |
| `prospect_deal` | Integer | Tidak | Flag deal |
| `prospect_not_deal` | Integer | Tidak | Flag Not Deal |
| `prospect_uncontact` | Integer | Tidak | Flag uncontact |
| `identify_has_fu` | String | Ya | YA/TIDAK |

## LCR

Field utama: `nomor_mesin`, `nomor_rangka`, `tipe_motor`, `tanggal_faktur`,
`nama_konsumen`, dan `kode_dealer`. Field pendukungnya meliputi `or_rangka`,
`sudah_dilakukan_pengerjaan`, `no_hp`, field duplikasi mesin/rangka, alamat,
`nama_dealer_2`, `area_ring`, `type_motor`, dan `nama_sales`.

## Niguri H1

Grain: satu periode bulan dan kategori sumber. Field wajib:
`month`, `data_source_kategori`, `total_data_source`,
`total_data_analysis_result`, `total_data_followup_phone`, `total_prospect`,
`total_customer_deal`, dan `total_unit_sold`.

Field metrik opsional: `sms_sent`, `sms_failed`, `workload_m_minus_1`,
`call_contacted`, `call_unreachable`, `call_rejected`, `call_workload`,
`prospect_m_minus_2`, `prospect_m_minus_1`, `prospect_m`, `tracking_pending_m2`,
`direct_touch_deal`, `direct_touch_hot_prospect`, `direct_touch_low_prospect`,
`direct_touch_not_deal`, dan `text_analysis`.

## Niguri H3

Grain: dealer, tahun, bulan, dan pipeline (`H1 to H3` atau `H2 to H3`). Field
wajib: `nama_dealer`, `year`, `month`, `data_source_pipeline`,
`total_data_di_follow_up`, `total_prospect`, dan `deal_konsumen`.

Field metrik opsional: `total_penjualan_part_rp`, `analysis_by`, `data_filtering`,
`sms_wa_sent`, `interest_m`, `workload_m_minus_1`, `prospect_customer_m_minus_2`,
`prospect_customer_m_minus_1`, `contacted_by_phone`, `unreachable`, `rejected`,
`workload`, `hot_prospect`, `low_prospect`, `not_deal`, `penjualan_part_rp`,
`penjualan_part_per_konsumen_rp`, dan `kontribusi_penjualan_part_percent`.
