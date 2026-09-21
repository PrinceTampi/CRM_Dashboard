'use client';

import React, { useEffect, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

type RepairOrderRow = {
  id: string;
  no: number;
  matchValue: string;
  matchMode: string;
  customer: string;
  phone: string;
  nik: string;
  kk: string;
  occurrences: number;
  firstDate: string;
  lastDate: string;
  rows: Array<{
    sourceNo: number;
    invoiceDate: string;
    dealer: string;
    engine: string;
    frame: string;
    paymentType: string;
    status: string;
    fileName: string;
    uploadedAt: string;
  }>;
};

function StatSummaryCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone: 'blue' | 'green' | 'orange' | 'red';
}) {
  return (
    <div className="stat-card stat-static">
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

function RoStatusBadge({ status }: { status: string }) {
  const className = status === 'Sesuai' ? 'success' : status === 'Perlu Review' ? 'danger' : 'warning';

  return <span className={`badge ${className}`}>{status}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function PortalOverview() {
  const [repairOrders, setRepairOrders] = useState<RepairOrderRow[]>([]);
  const [mode, setMode] = useState<'name' | 'nik' | 'kk' | 'phone'>('name');
  const [modeCounts, setModeCounts] = useState<Record<string, number>>({});
  const [selectedRO, setSelectedRO] = useState<RepairOrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/repair-orders', { cache: 'no-store' });
        const payload = await response.json();
        if (!active) return;
        const modes = payload.modes ?? [];
        const selected = modes.find((item: { mode: string }) => item.mode === mode) ?? modes[0];
        setModeCounts(Object.fromEntries(modes.map((item: { mode: string; groups: RepairOrderRow[] }) => [item.mode, item.groups.length])));
        setRepairOrders(selected?.groups ?? []);
        setSelectedRO(selected?.groups?.[0] ?? null);
      } catch {
        if (active) {
          setRepairOrders([]);
          setSelectedRO(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [mode]);

  const modeOptions = [
    { value: 'name' as const, label: 'R.O by Nama', icon: 'fa-user' },
    { value: 'nik' as const, label: 'R.O by NIK', icon: 'fa-id-card' },
    { value: 'kk' as const, label: 'R.O by Nomor KK', icon: 'fa-users' },
    { value: 'phone' as const, label: 'R.O by Nomor Telepon', icon: 'fa-phone' },
  ];

  return (
    <CrmShell title="Pengecekan R.O" crumb="Customer & AHASS">
      <div id="pengecekanro" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Pengecekan R.O</h2>
          <p>Data R.O otomatis terbentuk ketika identitas yang sama muncul pada lebih dari satu upload H1.</p>
        </div>

        <div className="kpi-hint">
          <i className="fas fa-circle-info" aria-hidden="true" /> Hanya identitas dengan minimal dua transaksi H1 yang ditampilkan sebagai kandidat R.O.
        </div>

        <div className="ro-mode-grid">
          {modeOptions.map((option) => (
            <button key={option.value} type="button" className={`ro-mode-card ${mode === option.value ? 'active' : ''}`} onClick={() => setMode(option.value)}>
              <i className={`fas ${option.icon}`} aria-hidden="true" />
              <span>{option.label}</span>
              <strong>{modeCounts[option.value] ?? 0}</strong>
            </button>
          ))}
        </div>

        <div className="stats-grid">
          <StatSummaryCard icon="fa-file-invoice" value={repairOrders.length} label="Total R.O" tone="blue" />
          <StatSummaryCard icon="fa-layer-group" value={repairOrders.reduce((total, row) => total + row.occurrences, 0)} label="Transaksi Terelaborasi" tone="green" />
          <StatSummaryCard icon="fa-calendar-plus" value={repairOrders.filter((r) => r.firstDate !== r.lastDate).length} label="Lintas Periode" tone="orange" />
          <StatSummaryCard icon="fa-fingerprint" value={repairOrders.length} label="Identitas Cocok" tone="red" />
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Daftar Repair Order
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No.</th><th>Nilai Cocok</th><th>Nama</th><th>NIK</th><th>Nomor KK</th><th>No. Telepon</th><th>Jumlah Data</th><th>Periode</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>
                      Memuat data Repair Order...
                    </td>
                  </tr>
                ) : repairOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <i className="fas fa-clipboard" />
                        <strong>Tidak ada data Repair Order yang cocok</strong>
                        <p>Belum ada identitas yang muncul lebih dari satu kali pada upload H1.</p>
                      </div>
                    </td>
                  </tr>
                ) : repairOrders.map((ro) => (
                  <tr
                    key={ro.no}
                    style={{
                      background: selectedRO?.no === ro.no ? 'rgba(11,30,51,0.04)' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedRO(ro)}
                  >
                    <td>{ro.no}</td>
                    <td><strong>{ro.matchValue}</strong></td>
                    <td>{ro.customer}</td>
                    <td>{ro.nik}</td>
                    <td>{ro.kk || '—'}</td>
                    <td>{ro.phone}</td>
                    <td><strong>{ro.occurrences}</strong> transaksi</td>
                    <td>{ro.firstDate} s/d {ro.lastDate}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRO(ro);
                        }}
                      >
                        Pratinjau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls" aria-hidden="true">
            <span className="page-info">Menampilkan {repairOrders.length} identitas cocok untuk {modeOptions.find((item) => item.value === mode)?.label}</span>
          </div>
        </div>

        <div className="card">
          <h3>Pratinjau detail R.O</h3>
          <div className="detail-grid">
            <div className="detail-block">
              <h4>Customer Information</h4>
              <DetailRow label="Nama" value={selectedRO ? selectedRO.customer : '—'} />
              <DetailRow label="No. Telepon" value={selectedRO ? selectedRO.phone : '—'} />
              <DetailRow label="NIK" value={selectedRO ? selectedRO.nik : '—'} />
              <DetailRow label="Nomor KK" value={selectedRO?.kk || '—'} />
            </div>
            <div className="detail-block">
              <h4>Vehicle Information</h4>
              <div className="detail-row">
                <span>Mode pencocokan</span>
                <strong>{selectedRO ? selectedRO.matchMode : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Tipe Kendaraan</span>
                <strong>{selectedRO ? 'Honda Automatic / Sport' : '—'}</strong>
              </div>
            </div>
            <div className="detail-block">
              <h4>Repair Order Information</h4>
              <div className="detail-row">
                <span>Nilai cocok</span>
                <strong>{selectedRO ? selectedRO.matchValue : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Jumlah data</span>
                <strong>{selectedRO ? `${selectedRO.occurrences} transaksi` : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Periode</span>
                <strong>{selectedRO ? `${selectedRO.firstDate} s/d ${selectedRO.lastDate}` : '—'}</strong>
              </div>
            </div>
            <div className="detail-block">
              <h4>Service Information</h4>
              <div className="detail-row">
                <span>Transaksi terbaru</span>
                <strong>{selectedRO ? selectedRO.rows[0]?.sourceNo.toString() : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>File terbaru</span>
                <strong>{selectedRO ? selectedRO.rows[0]?.fileName : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Dealer terbaru</span>
                <strong>{selectedRO ? selectedRO.rows[0]?.dealer : '—'}</strong>
              </div>
            </div>
          </div>
          <div className="form-section" style={{ marginTop: '16px' }}>
            <h4>Checking Result</h4>
            <p className="empty-kpi-sub">
              {selectedRO ? `Ditemukan ${selectedRO.occurrences} data H1 dengan ${selectedRO.matchMode} yang sama.` : 'Belum ada data R.O terelaborasi.'}
            </p>
          </div>
          <div className="form-section">
            <h4>Additional Notes</h4>
            <p className="empty-kpi-sub">
              {selectedRO ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Tanggal Faktur</th><th>File Upload</th><th>Dealer</th><th>No. Mesin</th><th>No. Rangka</th><th>Jenis Bayar</th></tr></thead>
                    <tbody>{selectedRO.rows.map((row) => <tr key={`${row.sourceNo}-${row.invoiceDate}`}><td>{row.invoiceDate}</td><td>{row.fileName}</td><td>{row.dealer}</td><td>{row.engine}</td><td>{row.frame}</td><td>{row.paymentType}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : 'Breakdown transaksi akan tampil setelah ada identitas yang cocok.'}
            </p>
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
