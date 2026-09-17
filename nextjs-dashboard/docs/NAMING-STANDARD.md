# Naming Standard

## 1. Folder naming

Gunakan nama yang jelas dan deskriptif sesuai fungsi fitur.

- `app/` untuk routes Next.js
- `components/` untuk komponen reusable umum
- `features/` untuk fitur bisnis utama
- `hooks/` untuk custom hooks
- `lib/` untuk utilitas, helper, dan formatter
- `types/` untuk tipe data global
- `docs/` untuk dokumentasi teknis

### Contoh
- `features/monitoring/`
- `features/upload/`
- `features/ahass/`
- `features/lcr/`

## 2. File naming

Gunakan format yang konsisten:

- `kebab-case` untuk nama file dan folder
- `PascalCase` untuk komponen React
- `camelCase` untuk fungsi helper dan hook

### Contoh
- `dashboard-overview.tsx`
- `upload-view.tsx`
- `app-version-notifier.tsx`
- `use-monitoring-summary.ts`

## 3. Komponen naming

- Nama komponen harus menggambarkan fungsi UI
- Hindari nama generik seperti `view`, `panel`, `card` tanpa konteks
- Untuk fitur spesifik, gunakan nama yang jelas seperti:
  - `MonitoringOverview`
  - `UploadIntegrationPanel`
  - `CustomerRegistrationForm`

## 4. Bahasa dan istilah

- Label UI dan dokumentasi gunakan Bahasa Indonesia jika project-nya adalah aplikasi internal lokal
- Variable, function, dan file masih dapat memakai bahasa Inggris untuk konsistensi teknis
- Hindari campur aduk istilah yang tidak konsisten seperti `FU`, `FU ulang tahun`, `followup`, `Follow Up` di berbagai tempat

## 5. Versioning aplikasi

Setiap update aplikasi harus di-versioning di `package.json` dan sinkron dengan notifikasi versi di UI.

- `package.json` => `"version": "1.0.0"`
- `AppVersionNotifier` menampilkan notifikasi saat versi berubah
- `localStorage` menyimpan versi terakhir yang dibaca user

## 6. Prinsip utama

- jelas dibaca developer
- konsisten antar modul
- mudah dicari saat maintenance
- tidak ada nama generik yang ambigu
- setia fitur punya satu tempat sumber logika
