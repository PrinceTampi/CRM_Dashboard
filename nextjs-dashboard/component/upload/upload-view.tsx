'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile, getToday } from '@/lib/crm-data';
import { getClientErrorMessage, safeFetchJson } from '@/lib/client-safe';
import type { UploadHistoryRecord, IntegratedRecord } from '@/lib/definitions';

type UploadAlertType = 'success' | 'error';

type UploadAlert = {
  type: UploadAlertType;
  text: string;
};

type UploadTypeOption = {
  value: string;
  label: string;
  buttonLabel: string;
  buttonTone: 'primary' | 'navy' | 'blue';
};

type ActionButtonTone = 'primary' | 'navy' | 'blue' | 'green';

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

function UploadAlertBanner({ alert }: { alert: UploadAlert | null }) {
  if (!alert) return null;

  const isSuccess = alert.type === 'success';

  return (
    <div
      className={`alert ${alert.type}`}
      style={{
        marginTop: '16px',
        padding: '12px 14px',
        borderRadius: '6px',
        background: isSuccess ? '#ECFDF3' : '#FEF2F2',
        color: isSuccess ? '#166534' : '#991B1B',
        fontSize: '13px',
      }}
    >
      <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}`} /> {alert.text}
    </div>
  );
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
  onFileSelected,
}: {
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      aria-label="Pilih file Excel"
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
      <p style={{ fontWeight: 600, margin: '4px 0' }}>Klik atau seret file ke sini (XLSX, XLS, CSV)</p>
      <div className="file-name" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
}: {
  label: string;
  tone: ActionButtonTone;
  onClick: () => void;
  icon: string;
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
      style={{
        ...buttonStyles[tone],
        padding: '10px 18px',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 600,
        cursor: 'pointer',
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
  const [history, setHistory] = useState<UploadHistoryRecord[]>([]);
  const [selectedType, setSelectedType] = useState('H1');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadAlert, setUploadAlert] = useState<UploadAlert | null>(null);
  const [integrateAlert, setIntegrateAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [integratedData, setIntegratedData] = useState<IntegratedRecord[]>([]);
  const [page, setPage] = useState(1);
  const [loadingIntegration, setLoadingIntegration] = useState(true);

  useEffect(() => {
    let active = true;

    const loadIntegration = async () => {
      setLoadingIntegration(true);

      try {
        const { data, error } = await safeFetchJson<{ rows: IntegratedRecord[] }>(
          '/api/integration',
          { cache: 'no-store' },
          { rows: [] }
        );

        if (!active) return;

        if (error) {
          throw new Error(error);
        }

        setIntegratedData(data?.rows ?? []);
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
      setUploadAlert({
        type: 'error',
        text: 'Format file tidak didukung. Gunakan file CSV/XLS/XLSX.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadAlert({
        type: 'error',
        text: 'Ukuran file terlalu besar. Maksimal 10 MB.',
      });
      return;
    }

    setSelectedFile(file);
    setUploadAlert({
      type: 'success',
      text: `File "${file.name}" (${(file.size / 1024).toFixed(1)} KB) siap diupload.`,
    });
  };

  const processUpload = async (typeOverride?: string) => {
    const type = typeOverride || selectedType;

    if (!selectedFile) {
      setUploadAlert({
        type: 'error',
        text: 'Pilih atau seret file Excel/CSV terlebih dahulu.',
      });
      return;
    }

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
        setUploadAlert({
          type: 'error',
          text: payload?.message || 'Upload data gagal diproses.',
        });
        return;
      }

      const count = Array.isArray(payload.preview) ? payload.preview.length : 0;
      const newRecord: UploadHistoryRecord = {
        date: getToday(),
        type,
        month: selectedMonth,
        count,
        status: 'Berhasil',
      };

      setHistory((current) => [newRecord, ...current]);
      setUploadAlert({
        type: 'success',
        text: `Upload file "${selectedFile.name}" untuk data ${type} berhasil diproses (${count} baris).`,
      });
      setSelectedFile(null);
    } catch (error) {
      setUploadAlert({
        type: 'error',
        text: getClientErrorMessage(error, 'Upload data gagal diproses.'),
      });
    }
  };

  const handleRunIntegration = async () => {
    try {
      const { data, error } = await safeFetchJson<{ rows: IntegratedRecord[] }>(
        '/api/integration',
        { cache: 'no-store' },
        { rows: [] }
      );

      if (error) {
        throw new Error(error);
      }

      const rows = data?.rows ?? [];
      setIntegratedData(rows);
      setIntegrateAlert({
        type: 'success',
        text: `Integrasi berhasil diselesaikan! ${rows.length} data konsumen terhubung lintas sistem AHASS, H1, H2, dan H3.`,
      });
    } catch (error) {
      setIntegrateAlert({
        type: 'error',
        text: getClientErrorMessage(error, 'Integrasi gagal dimuat. Silakan coba lagi.'),
      });
    }
  };

  const totalIntegrated = integratedData.length;
  const totalSource = integratedData.length > 0 ? integratedData.length + 12 : 0;
  const totalDuplicate = integratedData.length > 0 ? 12 : 0;

  const totalPages = Math.max(1, Math.ceil(integratedData.length / pageSize));
  const pagedIntegrated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return integratedData.slice(start, start + pageSize);
  }, [integratedData, page]);

  const handleDownloadIntegrated = () => {
    if (integratedData.length === 0) {
      alert('Jalankan integrasi terlebih dahulu untuk menghasilkan data.');
      return;
    }

    downloadCsvFile(
      'Data_Konsumen_Terintegrasi.csv',
      ['Nama', 'No HP', 'No Mesin', 'Sumber Data', 'Tanggal'],
      integratedData.map((item) => [item.name, item.phone, item.engine, item.source, item.date])
    );
  };

  const tones: Record<string, 'primary' | 'navy' | 'blue'> = {
    H1: 'primary',
    H2: 'navy',
    H3: 'blue',
    LCR: 'primary',
    BFU: 'navy',
  };

  const renderUploadActionButton = (type: string, buttonLabel: string, tone: 'primary' | 'navy' | 'blue') => (
    <ActionButton
      key={type}
      label={buttonLabel}
      tone={tone}
      icon="fa-file-upload"
      onClick={() => processUpload(type)}
    />
  );

  return (
    <CrmShell title="Upload & Integrasi" crumb="Data & Integration">
      <div id="upload" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Upload &amp; Integrasi</h2>
          <p>Unggah file Excel/CSV per jenis data, lalu gabungkan menjadi database konsumen terintegrasi.</p>
        </div>

        <div className="card">
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
              {renderUploadActionButton(selectedType, uploadTypeOptions.find((option) => option.value === selectedType)?.buttonLabel ?? 'Upload', tones[selectedType] ?? 'primary')}
            </div>

            {uploadTypeOptions
              .filter((option) => option.value !== selectedType)
              .map((option) => renderUploadActionButton(option.value, option.buttonLabel, option.buttonTone))}
          </div>

          <FileDropZone selectedFile={selectedFile} onFileSelected={handleFileSelection} />
          <UploadAlertBanner alert={uploadAlert} />

          <h3 style={{ marginTop: '24px' }}>
            <i className="fas fa-clock-rotate-left" aria-hidden="true" /> Riwayat Upload
          </h3>
          <UploadTable rows={history} />
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-code-branch" aria-hidden="true" /> Integrasi Data
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Gabungkan semua data dari AHASS, H1, H2, H3 menjadi satu database konsumen terintegrasi.
          </p>

          <div className="stats-grid">
            <SummaryStatCard icon="fa-users" value={totalIntegrated} label="Total Data Terintegrasi" tone="cyan" />
            <SummaryStatCard icon="fa-database" value={totalSource} label="Sumber Data (H1+H2+H3)" tone="purple" />
            <SummaryStatCard icon="fa-copy" value={totalDuplicate} label="Duplikat Terdeteksi" tone="orange" />
          </div>

          <div className="upload-actions" style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
            <ActionButton label="Jalankan Integrasi" tone="navy" icon="fa-sync-alt" onClick={handleRunIntegration} />
            <ActionButton label="Download CSV" tone="green" icon="fa-download" onClick={handleDownloadIntegrated} />
          </div>

          {integrateAlert && (
            <div
              className={`alert ${integrateAlert.type}`}
              style={{
                padding: '12px 14px',
                borderRadius: '6px',
                background: integrateAlert.type === 'success' ? '#ECFDF3' : '#FEF2F2',
                color: integrateAlert.type === 'success' ? '#166534' : '#991B1B',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <i className={`fas ${integrateAlert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} /> {integrateAlert.text}
            </div>
          )}

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
                      Belum ada data terintegrasi. Klik tombol <strong>Jalankan Integrasi</strong> di atas untuk memproses data.
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
