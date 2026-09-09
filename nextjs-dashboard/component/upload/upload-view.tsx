'use client';

import React, { useState, useMemo } from 'react';
import { CrmShell, useCrmModal } from '@/component/layout/crm-shell';
import { initialUploadHistory, initialEventData, initialBirthdayMaster, downloadCsvFile, getToday } from '@/lib/crm-data';
import type { UploadHistoryRecord, IntegratedRecord } from '@/lib/definitions';

export function UploadView() {
  const { openModal } = useCrmModal();

  const [history, setHistory] = useState<UploadHistoryRecord[]>(initialUploadHistory);
  const [selectedType, setSelectedType] = useState('H1');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadAlert, setUploadAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [integrateAlert, setIntegrateAlert] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Integrated data state
  const [integratedData, setIntegratedData] = useState<IntegratedRecord[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadAlert({
        type: 'success',
        text: `File "${file.name}" (${(file.size / 1024).toFixed(1)} KB) siap diupload.`,
      });
    }
  };

  const processUpload = (typeOverride?: string) => {
    const type = typeOverride || selectedType;
    if (!selectedFile) {
      setUploadAlert({
        type: 'error',
        text: 'Pilih atau seret file Excel/CSV terlebih dahulu.',
      });
      return;
    }

    const newRecord: UploadHistoryRecord = {
      date: getToday(),
      type,
      month: selectedMonth,
      count: Math.floor(Math.random() * 200) + 50,
      status: 'Berhasil',
    };

    setHistory([newRecord, ...history]);
    setUploadAlert({
      type: 'success',
      text: `Upload file "${selectedFile.name}" untuk data ${type} berhasil diproses (${newRecord.count} baris).`,
    });
    setSelectedFile(null);
  };

  const handleRunIntegration = () => {
    // Generate integrated records from events + birthday master sample
    const fromEvents: IntegratedRecord[] = initialEventData.map((e) => ({
      name: e.name,
      phone: e.phone,
      engine: e.engine,
      source: 'AHASS Event',
      date: e.date,
    }));

    const fromH1: IntegratedRecord[] = initialBirthdayMaster.slice(0, 30).map((c, i) => ({
      name: c.name,
      phone: c.phone,
      engine: `JFD2E ${2447800 + i}`,
      source: 'H1 Penjualan',
      date: '2026-08-15',
    }));

    const combined = [...fromEvents, ...fromH1];
    setIntegratedData(combined);
    setIntegrateAlert({
      type: 'success',
      text: `Integrasi berhasil diselesaikan! ${combined.length} data konsumen terhubung lintas sistem AHASS, H1, H2, dan H3.`,
    });
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
      integratedData.map((d) => [d.name, d.phone, d.engine, d.source, d.date])
    );
  };

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
              <select
                id="uploadType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="H1">H1 - Penjualan</option>
                <option value="H2">H2 - Hasil FU (Service)</option>
                <option value="H3">H3 - Sparepart</option>
                <option value="BFU">FU Ulang Tahun (Compare Deal)</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: '1 1 160px' }}>
              <label htmlFor="uploadMonth">Bulan Data</label>
              <input
                type="month"
                id="uploadMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <button
                type="button"
                className="btn-submit upload"
                onClick={() => processUpload()}
                style={{ background: '#CC0000', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-upload" aria-hidden="true" /> Upload
              </button>
            </div>

            <div className="form-group">
              <button
                type="button"
                className="btn-submit fu"
                onClick={() => processUpload('H2')}
                style={{ background: '#0B1E33', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-file-upload" aria-hidden="true" /> Upload FU (H2)
              </button>
            </div>

            <div className="form-group">
              <button
                type="button"
                className="btn-submit h3"
                onClick={() => processUpload('H3')}
                style={{ background: '#1E3A8A', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-file-upload" aria-hidden="true" /> Upload FU (H3)
              </button>
            </div>
          </div>

          <div
            className="file-upload-area"
            id="fileDropZone"
            onClick={() => document.getElementById('fileUploadInput')?.click()}
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
            <div className="file-name" id="fileNameDisplay" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {selectedFile ? `File terpilih: ${selectedFile.name}` : 'Belum ada file dipilih'}
            </div>
            <input
              type="file"
              id="fileUploadInput"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {uploadAlert && (
            <div
              className={`alert ${uploadAlert.type}`}
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '6px',
                background: uploadAlert.type === 'success' ? '#ECFDF3' : '#FEF2F2',
                color: uploadAlert.type === 'success' ? '#166534' : '#991B1B',
                fontSize: '13px',
              }}
            >
              <i className={`fas ${uploadAlert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />{' '}
              {uploadAlert.text}
            </div>
          )}

          <h3 style={{ marginTop: '24px' }}>
            <i className="fas fa-clock-rotate-left" aria-hidden="true" /> Riwayat Upload
          </h3>
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
              <tbody id="uploadHistoryTable">
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{h.date}</td>
                    <td><span className="badge info">{h.type}</span></td>
                    <td>{h.month}</td>
                    <td><strong>{h.count.toLocaleString()}</strong> data</td>
                    <td><span className="badge success">{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-code-branch" aria-hidden="true" /> Integrasi Data
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Gabungkan semua data dari AHASS, H1, H2, H3 menjadi satu database konsumen terintegrasi.
          </p>

          <div className="stats-grid">
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon cyan">
                <i className="fas fa-users" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number" id="integratedTotal">
                  {totalIntegrated}
                </div>
                <div className="label">Total Data Terintegrasi</div>
              </div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon purple">
                <i className="fas fa-database" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number" id="sourceTotal">
                  {totalSource}
                </div>
                <div className="label">Sumber Data (H1+H2+H3)</div>
              </div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon orange">
                <i className="fas fa-copy" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number" id="duplicateTotal">
                  {totalDuplicate}
                </div>
                <div className="label">Duplikat Terdeteksi</div>
              </div>
            </div>
          </div>

          <div className="upload-actions" style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
            <button
              type="button"
              className="btn-submit integrate"
              onClick={handleRunIntegration}
              style={{ background: '#0B1E33', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fas fa-sync-alt" aria-hidden="true" /> Jalankan Integrasi
            </button>
            <button
              type="button"
              className="btn-submit"
              onClick={handleDownloadIntegrated}
              style={{ background: '#15803D', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </div>

          {integrateAlert && (
            <div
              className="alert success"
              style={{
                padding: '12px 14px',
                borderRadius: '6px',
                background: '#ECFDF3',
                color: '#166534',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <i className="fas fa-check-circle" /> {integrateAlert.text}
            </div>
          )}

          <h4 style={{ fontWeight: 600, fontSize: '14px', margin: '16px 0 12px' }}>
            <i className="fas fa-table" aria-hidden="true" /> Data Terintegrasi{' '}
            <span id="integratedCount">{integratedData.length > 0 ? `(${integratedData.length} data)` : ''}</span>
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
              <tbody id="integratedTable">
                {pagedIntegrated.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.phone}</td>
                    <td><code>{d.engine}</code></td>
                    <td><span className="badge info">{d.source}</span></td>
                    <td>{d.date}</td>
                  </tr>
                ))}
                {pagedIntegrated.length === 0 && (
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
            <div className="pagination-controls" id="integratedTablePagination">
              <span className="page-info">
                Halaman {page} dari {totalPages} ({integratedData.length} data)
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  &laquo;
                </button>
                <button type="button" className="page-btn active">
                  {page}
                </button>
                <button
                  type="button"
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CrmShell>
  );
}
