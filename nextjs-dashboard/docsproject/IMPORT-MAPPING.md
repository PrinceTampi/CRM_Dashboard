# Draft Import Mapping

Status: draft hasil inspeksi workbook contoh. Mapping ini belum menjadi validasi
produksi dan tidak mengubah database.

## Model proses

Satu workbook diperlakukan sebagai satu `ImportBatch`. Setiap worksheet
diperlakukan sebagai sumber terpisah dan menghasilkan `ImportRow` dengan
`sheetName` serta nomor baris asal.

```text
Workbook
  -> ImportBatch
  -> satu parser per worksheet
  -> ImportRow mentah
  -> validasi dan normalisasi
  -> upsert tabel domain
```

## File yang tersedia

| File | Sheet yang terdeteksi | Kandidat domain | Status |
| --- | --- | --- | --- |
| `Data Dummy H1.xlsx` | `H1` | H1 sales/customer/vehicle | Mapping awal tersedia |
| `Data Dummy H2&H3.xls` | `Data` | H23: H2 service + H3 part/partservice | Satu workbook, routing berdasarkan jenis transaksi |
| `Report Niguri CRM Dealer.xlsx` | `Niguri H1`, `Niguri H3` | Report agregat | Jangan import sebagai transaksi mentah |
| `LCR MSJ.xlsx` | `Sheet1` | LCR campaign | Kolom mesin/rangka berulang |
| `H3_Activate_15012_2026-09-15.xlsx` | data utama, `Master LoV` | H3 activation + LoV | ID lead harus immutable |
| `DataProspek (34) (2).xlsx` | `PROSPEK` | Prospect pipeline | Berbeda dari transaksi |

## Mapping H1

| Header sumber | Tujuan kandidat | Catatan |
| --- | --- | --- |
| `Kode Dealer` | `Dealer.code` | Konfirmasi master dealer |
| `Tanggal Faktur` | `H1Sale.invoiceDate` | Parser mendukung format `DD-MMM-YY` |
| `Nama Konsumen` | `Customer.name` | Simpan nilai asli dan bentuk normalisasi |
| `No KTP` | `Customer.nik` | Wajib untuk H1; menjadi kunci pencarian customer |
| `Tanggal Lahir` | `Customer.birthDate` | Format `DD-MMM-YY` |
| `No HP` / `No Telp` | `Customer.phone` | Prioritas dan fallback harus ditetapkan |
| `Nomor Mesin` | `Vehicle.engineNumber` | Kandidat alternate key |
| `Nomor Rangka` | `Vehicle.frameNumber` | Kandidat alternate key |
| `Tipe dan Warna` | `Vehicle.model` / `Vehicle.color` | Perlu pemisahan nilai |
| `Jenis Bayar` | `H1Sale.paymentType` | Enum belum ditetapkan |
| `Status Faktur` | `H1Sale.status` | Enum belum ditetapkan |

## Mapping H23 dari sheet `Data`

Sheet `Data` adalah sumber gabungan H2 dan H3. Header invoice, customer, dan
kendaraan diproses bersama, lalu baris diarahkan berdasarkan `Jenis Transaksi`:

- `SERVICE` -> detail H2 service.
- `PART` atau `PARTSERVICE` -> detail H3 part.

| Header sumber | Tujuan kandidat | Catatan |
| --- | --- | --- |
| `Inv No` | `H23Invoice.invoiceNumber` | Satu invoice dapat memiliki banyak item |
| `Tgl Invoice` | `H23Invoice.invoiceDate` | Format `DD-MMM-YY` |
| `Cust Name` | customer matching | Hanya fallback jika key kuat tidak tersedia |
| `Item No` | `H2ServiceItem.itemNumber` atau `H3PartItem.itemNumber` | Kandidat key item |
| `Item Desc` | `H2ServiceItem.description` atau `H3PartItem.description` | Nilai deskriptif |
| `Qty` | detail H2/H3 `quantity` | Validasi integer positif |
| `Price` | detail H2/H3 `price` | Parser angka, bukan string mata uang |
| `Gross Amt` | detail H2/H3 `grossAmount` | Validasi konsistensi dengan Qty dan Price |
| `Dealer Name` | `Dealer.name` | Perlu pencocokan ke `Kode Dealer` |
| `No Hp` | customer matching | Normalisasi nomor telepon |
| `Noka` / `Nosin` | vehicle matching | Periksa variasi spasi dan format |
| `Vehicle Model` / `Vehicle Group` | vehicle | Master model belum tersedia |

## Mapping LCR

| Header sumber | Tujuan kandidat | Catatan |
| --- | --- | --- |
| `Nomor Mesin` pertama | `Vehicle.engineNumber` | Identifier utama |
| `Nomor Rangka` pertama | `Vehicle.frameNumber` | Identifier utama |
| `or Rangka` | `LcrCampaignRecord.referenceFrame` | Format alternatif |
| `Sudah dilakukan Pengerjaan...` | `LcrCampaignRecord.treatmentStatus` | `Sudah LCR` menjadi treated |
| `Kode Dealer` | `Dealer.code` | Dealer asal |
| `Nama Dealer 2` | `LcrCampaignRecord.operatingDealer` | Dealer pelaksana |
| `Area Ring` | `LcrCampaignRecord.ring` | Wilayah campaign |

Kolom `Nomor Mesin` dan `Nomor Rangka` yang muncul kedua kali harus diberi
posisi/header internal berbeda saat parsing agar tidak saling menimpa.

## Mapping DataProspek

| Header sumber | Tujuan kandidat |
| --- | --- |
| `ID Guestbook` | `ProspectLead.guestbookId` |
| `ID Leads` | `ProspectLead.leadId` |
| `Tgl Input Guestbook` | `ProspectLead.guestbookAt` |
| `Channel Penjualan` | `ProspectLead.salesChannel` |
| `Kode Event` / `Deskripsi Event` | `ProspectLead.eventCode` / `eventDescription` |
| `Platform Data` | `ProspectLead.platform` |
| `Lead Time Funnel` / `Lead Time FU(Hari)` | funnel metrics |
| `Contact Status` / `Media Contact FU` | contact state/channel |
| `Next Follow Up` / `Batas SLA` | scheduling/SLA |
| `Sudah membeli` / `Alasan Not Deal` | outcome |
| `Nama Prospek` / `No. HP Prospek` | customer matching |
| `Tipe Prospek` / `Tipe Customer` | segmentation |
| `Dealer` / `Status` | assignment/status |

## Workbook report Niguri

`Niguri H1` dan `Niguri H3` tampak sebagai format laporan matriks/agregasi.
Jangan memasukkannya ke tabel `H1Sale`, `H2ServiceItem`, atau `H3PartItem` tanpa aturan
tambahan. Pilihan yang disarankan:

1. Hitung report dari tabel domain setelah import H1/H2/H3; atau
2. Simpan sebagai `ReportSnapshot` dengan periode, dealer, sheet, dan payload
   agregat jika hasil historis harus dipertahankan.

## Error yang wajib disimpan

- sheet tidak dikenal
- header wajib hilang
- tanggal tidak dapat diparse
- angka Qty/Price/Gross Amt tidak valid
- customer tidak dapat dipasangkan
- duplikat invoice atau nomor mesin
- workbook memiliki sheet H2 yang tidak sesuai kontrak
