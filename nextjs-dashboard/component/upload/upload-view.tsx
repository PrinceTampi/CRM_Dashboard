'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CrmShell, useCrmToast } from '@/component/layout/crm-shell';
import { downloadCsvFile, getToday } from '@/lib/crm-data';
import { getClientErrorMessage, safeFetchJson } from '@/lib/client-safe';
import type { UploadHistoryRecord, IntegratedRecord } from '@/lib/definitions';

type UploadTypeOption = {
  value: string;
  label: string;
  buttonLabel: string;
  buttonTone: 'primary' | 'navy' | 'blue';
};

type ActionButtonTone = 'primary' | 'navy' | 'blue' | 'green';

type IntegrationSummary = {
  totalCustomers: number;
  completeCustomers: number;
  incompleteCustomers: number;
};

const uploadTypeOptions: UploadTypeOption[] = [
  { value: 'H1', label: 'H1 - Penjualan', buttonLabel: 'Upload', buttonTone: 'primary' },
  { value: 'H2', label: 'H2 - Hasil FU (Service)', buttonLabel: 'Upload FU (H2)', buttonTone: 'navy' },
  { value: 'H3', label: 'H3 - Sparepart', buttonLabel: 'Upload FU (H3)', buttonTone: 'blue' },
  { value: 'LCR', label: 'LCR - Campaign', buttonLabel: 'Upload LCR', buttonTone: 'primary' },
  { value: 'BFU', label: 'FU Ulang Tahun (Compare Deal)', buttonLabel: 'Upload BFU', buttonTone: 'navy' },
];

const pageSize = 10;

function getUploadEndpoint(type: string) {
  switch (type) {
    case 'H1':
      return '/api/upload/h1';
    case 'LCR':
      return '/api/upload/lcr';
    case 'H2':
    case 'H3':
    default:
      return '/api/upload/h23';
  }
}

function SummaryStatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone: 'cyan' | 'purple' | 'orange';
}) {
  return (
    <div className="stat-card" style={{ cursor: 'pointer' }}>
      <div className={`stat-icon ${tone}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <div className="stat-info">
        <div className="number">{value}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}

function FileDropZone({
  selectedFile,
  selectedType,
  selectedMonth,
  onFileSelected,
}: {
  selectedFile: File | null;
  selectedType: string;
  selectedMonth: string;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedTypeLabel = uploadTypeOptions.find((option) => option.value === selectedType)?.label ?? selectedType;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelected(file);
  };

  return (
    <div
      className="file-upload-area"
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Pilih file untuk ${selectedTypeLabel}`}
      style={{
        marginTop: '16px',
        border: '2px dashed var(--border-strong)',
        borderRadius: '8px',
        padding: '28px',
        textAlign: 'center',
        background: '#FAFAFA',
        cursor: 'pointer',
      }}
    >
      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '36px', color: '#CC0000', marginBottom: '8px' }} aria-hidden="true" />
      <p style={{ fontWeight: 600, margin: '4px 0' }}>Klik atau seret file ke sini</p>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {selectedTypeLabel} · {selectedMonth} · XLSX, XLS, CSV · Maks. 10 MB
      </div>
      <div
        className="file-name"
        style={{
          display: 'inline-block',
          marginTop: '4px',
          padding: selectedFile ? '6px 10px' : 0,
          borderRadius: '5px',
          fontSize: '13px',
          fontWeight: selectedFile ? 700 : 400,
          color: selectedFile ? '#15803D' : 'var(--text-secondary)',
          background: selectedFile ? '#DCFCE7' : 'transparent',
        }}
      >
        {selectedFile ? `File terpilih: ${selectedFile.name}` : 'Belum ada file dipilih'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}

function UploadTable({ rows }: { rows: UploadHistoryRecord[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Bulan</th>
            <th>Jumlah</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                Belum ada riwayat upload.
              </td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={`${row.date}-${row.type}-${index}`}>
              <td>{row.date}</td>
              <td><span className="badge info">{row.type}</span></td>
              <td>{row.month}</td>
              <td><strong>{row.count.toLocaleString()}</strong> data</td>
              <td><span className="badge success">{row.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
  icon,
  disabled = false,
}: {
  label: string;
  tone: ActionButtonTone;
  onClick: () => void;
  icon: string;
  disabled?: boolean;
}) {
  const buttonStyles: Record<ActionButtonTone, { background: string; color: string }> = {
    primary: { background: '#CC0000', color: '#fff' },
    navy: { background: '#0B1E33', color: '#fff' },
    blue: { background: '#1E3A8A', color: '#fff' },
    green: { background: '#15803D', color: '#fff' },
  };

  return (
    <button
      type="button"
      className="btn-submit"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyles[tone],
        padding: '10px 18px',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <i className={`fas ${icon}`} aria-hidden="true" /> {label}
    </button>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pagination-controls">
      <span className="page-info">
        Halaman {page} dari {totalPages} ({totalItems} data)
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button type="button" className="page-btn" disabled={page <= 1} onClick={onPrev}>&laquo;</button>
        <button type="button" className="page-btn active">{page}</button>
        <button type="button" className="page-btn" disabled={page >= totalPages} onClick={onNext}>&raquo;</button>
      </div>
    </div>
  );
}

export function UploadView() {
  const { showToast } = useCrmToast();
  const [history, setHistory] = useState<UploadHistoryRecord[]>([]);
  const [selectedType, setSelectedType] = useState('H1');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [integratedData, setIntegratedData] = useState<IntegratedRecord[]>([]);
  const [integrationSummary, setIntegrationSummary] = useState<IntegrationSummary>({
    totalCustomers: 0,
    completeCustomers: 0,
    incompleteCustomers: 0,
  });
  const [page, setPage] = useState(1);
  const [loadingIntegration, setLoadingIntegration] = useState(true);

  useEffect(() => {
    let active = true;

    const loadIntegration = async () => {
      setLoadingIntegration(true);

      try {
        const { data, error } = await safeFetchJson<{ rows: IntegratedRecord[]; summary?: IntegrationSummary }>(
          '/api/integration',
          { cache: 'no-store' },
          { rows: [] }
        );

        if (!active) return;

        if (error) {
          throw new Error(error);
        }

        setIntegratedData(data?.rows ?? []);
        setIntegrationSummary(data?.summary ?? {
          totalCustomers: data?.rows?.length ?? 0,
          completeCustomers: 0,
          incompleteCustomers: data?.rows?.length ?? 0,
        });
      } catch {
        if (active) setIntegratedData([]);
      } finally {
        if (active) setLoadingIntegration(false);
      }
    };

    loadIntegration();
    return () => {
      active = false;
    };
  }, []);

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = ['csv', 'xls', 'xlsx'];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (!allowedExtensions.includes(extension)) {
      setSelectedFile(null);
      showToast('error', 'Format file tidak didukung. Gunakan file CSV/XLS/XLSX.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      showToast('error', 'Ukuran file terlalu besar. Maksimal 10 MB.');
      return;
    }

    setSelectedFile(file);
    showToast('info', `File "${file.name}" (${(file.size / 1024).toFixed(1)} KB) siap diupload.`);
  };

  const processUpload = async (typeOverride?: string) => {
    const type = typeOverride || selectedType;

    if (!selectedFile) {
      showToast('warning', 'Pilih atau seret file Excel/CSV terlebih dahulu.');
      return;
    }

    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(8);
    showToast('info', `Upload ${selectedFile.name} sedang diproses. Mohon tunggu.`);

    const progressTimer = window.setInterval(() => {
      setUploadProgress((current) => Math.min(current + Math.max(1, Math.round((92 - current) / 8)), 92));
    }, 450);

    const formData = new FormData();
    formData.append('file', selectedFile);

    if (type !== 'H1') {
      formData.append('type', type);
    }

    try {
      const response = await fetch(getUploadEndpoint(type), {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({
        ok: false,
        message: 'Respons server tidak valid.',
      }));

      if (!response.ok || !payload?.ok) {
        showToast('error', payload?.message || 'Upload data gagal diproses.');
        return;
      }

      const count = typeof payload.totalRows === 'number'
        ? payload.totalRows
        : Array.isArray(payload.preview) ? payload.preview.length : 0;
      const newRecord: UploadHistoryRecord = {
        date: getToday(),
        type,
        month: selectedMonth,
        count,
        status: 'Berhasil',
      };

      setHistory((current) => [newRecord, ...current]);
      const importedRows = typeof payload.importedRows === 'number' ? payload.importedRows : count;
      const updatedRows = typeof payload.updatedSales === 'number' ? payload.updatedSales : 0;
      const warnings = typeof payload.warnings === 'number' ? payload.warnings : 0;
      const duplicateRows = typeof payload.duplicateRows === 'number' ? payload.duplicateRows : 0;
      showToast(
        warnings > 0 ? 'warning' : 'success',
        `Upload "${selectedFile.name}" selesai: ${count} baris dibaca, ${importedRows} berhasil diproses, ${updatedRows} data diperbarui${duplicateRows > 0 ? `, ${duplicateRows} duplikat diperbarui` : ''}${warnings > 0 ? `, ${warnings} warning` : ''}.`,
      );
      setUploadProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setSelectedFile(null);
    } catch (error) {
      showToast('error', getClientErrorMessage(error, 'Upload data gagal diproses.'));
    } finally {
      window.clearInterval(progressTimer);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRunIntegration = async () => {
    try {
      const { data, error } = await safeFetchJson<{ rows: IntegratedRecord[]; summary?: IntegrationSummary }>(
        '/api/integration',
        { cache: 'no-store' },
        { rows: [] }
      );

      if (error) {
        throw new Error(error);
      }

      const rows = data?.rows ?? [];
      setIntegratedData(rows);
      setIntegrationSummary(data?.summary ?? {
        totalCustomers: rows.length,
        completeCustomers: 0,
        incompleteCustomers: rows.length,
      });
      showToast('success', `Integrasi berhasil diselesaikan! ${rows.length} data konsumen terhubung lintas sistem AHASS, H1, H2, dan H3.`);
    } catch (error) {
      showToast('error', getClientErrorMessage(error, 'Integrasi gagal dimuat. Silakan coba lagi.'));
    }
  };

  const totalIntegrated = integrationSummary.totalCustomers;
  const totalComplete = integrationSummary.completeCustomers;
  const totalIncomplete = integrationSummary.incompleteCustomers;

  const totalPages = Math.max(1, Math.ceil(integratedData.length / pageSize));
  const pagedIntegrated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return integratedData.slice(start, start + pageSize);
  }, [integratedData, page]);

  const handleDownloadIntegrated = () => {
    if (integratedData.length === 0) {
      showToast('warning', 'Jalankan integrasi terlebih dahulu untuk menghasilkan data.');
      return;
    }

    downloadCsvFile(
      'Data_Konsumen_Terintegrasi.csv',
      ['Nama', 'No HP', 'No Mesin', 'Sumber Data', 'Tanggal'],
      integratedData.map((item) => [item.name, item.phone, item.engine, item.source, item.date])
    );
  };

  const selectedTypeLabel = uploadTypeOptions.find((option) => option.value === selectedType)?.label ?? selectedType;
  const canRunIntegration = history.length > 0 || integratedData.length > 0;

  return (
    <CrmShell title="Upload & Integrasi" crumb="Data & Integration">
      <div id="upload" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Upload &amp; Integrasi</h2>
          <p>Unggah file Excel/CSV per jenis data, lalu gabungkan menjadi database konsumen terintegrasi.</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Langkah 1</strong>
            <span>Pilih jenis data, bulan, file, lalu upload.</span>
          </div>

          <div className="form-row-5" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label htmlFor="uploadType">
                Jenis Data <span className="required" style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select id="uploadType" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {uploadTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: '1 1 160px' }}>
              <label htmlFor="uploadMonth">Bulan Data</label>
              <input type="month" id="uploadMonth" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </div>

            <div className="form-group">
              <ActionButton
                label={`Upload ${selectedTypeLabel}`}
                tone="primary"
                icon="fa-file-upload"
                disabled={isUploading || !selectedFile}
                onClick={() => processUpload()}
              />
            </div>
          </div>

          <FileDropZone
            selectedFile={selectedFile}
            selectedType={selectedType}
            selectedMonth={selectedMonth}
            onFileSelected={handleFileSelection}
          />
          {isUploading && (
            <div className="upload-progress" role="status" aria-live="polite">
              <div className="upload-progress-label">
                <span>Data sedang diupload dan diproses...</span>
                <strong>{uploadProgress}%</strong>
              </div>
              <div className="upload-progress-track" aria-hidden="true">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="upload-progress-hint">Jangan tutup halaman sampai proses selesai.</p>
            </div>
          )}

          <h3 style={{ marginTop: '24px' }}>
            <i className="fas fa-clock-rotate-left" aria-hidden="true" /> Riwayat Upload
          </h3>
          <UploadTable rows={history} />
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-code-branch" aria-hidden="true" /> Langkah 2: Integrasi Data
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Gabungkan semua data dari AHASS, H1, H2, H3 menjadi satu database konsumen terintegrasi.
          </p>

          <div className="stats-grid">
            <SummaryStatCard icon="fa-users" value={totalIntegrated} label="Total Konsumen" tone="cyan" />
            <SummaryStatCard icon="fa-user-check" value={totalComplete} label="Data Lengkap" tone="purple" />
            <SummaryStatCard icon="fa-user-clock" value={totalIncomplete} label="Perlu Dilengkapi" tone="orange" />
          </div>

          <div className="upload-actions" style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
            <ActionButton
              label="Jalankan Integrasi"
              tone="navy"
              icon="fa-sync-alt"
              disabled={!canRunIntegration}
              onClick={handleRunIntegration}
            />
            <ActionButton label="Download CSV" tone="green" icon="fa-download" onClick={handleDownloadIntegrated} />
          </div>

          <h4 style={{ fontWeight: 600, fontSize: '14px', margin: '16px 0 12px' }}>
            <i className="fas fa-table" aria-hidden="true" /> Data Terintegrasi{' '}
            <span>{integratedData.length > 0 ? `(${integratedData.length} data)` : ''}</span>
          </h4>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>No Mesin</th>
                  <th>Sumber</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loadingIntegration ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Memuat data terintegrasi dari database...
                    </td>
                  </tr>
                ) : pagedIntegrated.length > 0 ? pagedIntegrated.map((item, index) => (
                  <tr key={`${item.name}-${item.phone}-${index}`}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.phone}</td>
                    <td><code>{item.engine}</code></td>
                    <td><span className="badge info">{item.source}</span></td>
                    <td>{item.date}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Belum ada data terintegrasi. Upload data terlebih dahulu, lalu klik <strong>Jalankan Integrasi</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {integratedData.length > 0 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={integratedData.length}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          )}
        </div>
      </div>
    </CrmShell>
  );
}
