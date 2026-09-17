'use client';

import React, { useEffect, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

type RepairOrderRow = {
  no: number;
  customer: string;
  phone: string;
  nik: string;
  engine: string;
  roNumber: string;
  ahass: string;
  date: string;
  job: string;
  status: string;
  cost: number;
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
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
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
        setRepairOrders(payload.rows ?? []);
        setSelectedRO((payload.rows ?? [])[0] ?? null);
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
  }, []);

  const filteredROs = repairOrders.filter((ro) => {
    const matchCust = !customerSearch || ro.customer.toLowerCase().includes(customerSearch.toLowerCase()) || ro.phone.includes(customerSearch) || ro.nik.includes(customerSearch) || ro.roNumber.toLowerCase().includes(customerSearch.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || ro.status === statusFilter;
    return matchCust && matchStatus;
  });

  return (
    <CrmShell title="Pengecekan R.O" crumb="Customer & AHASS">
      <div id="pengecekanro" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Pengecekan R.O</h2>
          <p>Monitoring dan pengecekan data Repair Order. Struktur antarmuka disiapkan untuk integrasi data operasional.</p>
        </div>

        <div className="kpi-hint">
          <i className="fas fa-circle-info" aria-hidden="true" /> Sumber data Repair Order terhubung dengan data operasional simulasi. Filter dan pratinjau detail aktif dan dapat diuji.
        </div>

        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="roSearchCustomer">Search Customer / No. R.O</label>
            <input
              id="roSearchCustomer"
              className="filter-input"
              type="search"
              placeholder="Nama, No HP, NIK, atau No RO"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="roSearchPhone">No. HP</label>
            <input
              id="roSearchPhone"
              type="text"
              placeholder="08xxxxxxxxxx"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="roStatus">Status</label>
            <select
              id="roStatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua status</option>
              <option value="Belum Dicek">Belum Dicek</option>
              <option value="Sudah Dicek">Sudah Dicek</option>
              <option value="Sesuai">Sesuai</option>
              <option value="Tidak Sesuai">Tidak Sesuai</option>
              <option value="Perlu Review">Perlu Review</option>
            </select>
          </div>
        </div>

        <div className="stats-grid">
          <StatSummaryCard icon="fa-file-invoice" value={repairOrders.length} label="Total R.O" tone="blue" />
          <StatSummaryCard icon="fa-check" value={repairOrders.filter((r) => r.status === 'Sesuai').length} label="R.O Terverifikasi" tone="green" />
          <StatSummaryCard icon="fa-hourglass-half" value={repairOrders.filter((r) => r.status === 'Belum Dicek').length} label="R.O Belum Dicek" tone="orange" />
          <StatSummaryCard icon="fa-triangle-exclamation" value={repairOrders.filter((r) => r.status === 'Perlu Review').length} label="R.O Bermasalah / Review" tone="red" />
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Daftar Repair Order
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Customer</th>
                  <th>No HP</th>
                  <th>NIK</th>
                  <th>Engine Number</th>
                  <th>No. R.O</th>
                  <th>AHASS</th>
                  <th>Tanggal R.O</th>
                  <th>Service / Job</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>
                      Memuat data Repair Order...
                    </td>
                  </tr>
                ) : filteredROs.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">
                        <i className="fas fa-clipboard" />
                        <strong>Tidak ada data Repair Order yang cocok</strong>
                        <p>Ubah kata kunci filter pencarian di atas untuk melihat data.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredROs.map((ro) => (
                  <tr
                    key={ro.no}
                    style={{
                      background: selectedRO?.no === ro.no ? 'rgba(11,30,51,0.04)' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedRO(ro)}
                  >
                    <td>{ro.no}</td>
                    <td><strong>{ro.customer}</strong></td>
                    <td>{ro.phone}</td>
                    <td>{ro.nik}</td>
                    <td><code>{ro.engine}</code></td>
                    <td><strong>{ro.roNumber}</strong></td>
                    <td>{ro.ahass}</td>
                    <td>{ro.date}</td>
                    <td>{ro.job}</td>
                    <td>
                      <RoStatusBadge status={ro.status} />
                    </td>
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
            <span className="page-info">Menampilkan {filteredROs.length} dari {repairOrders.length} R.O</span>
          </div>
        </div>

        <div className="card">
          <h3>Pratinjau detail R.O</h3>
          <div className="detail-grid">
            <div className="detail-block">
              <h4>Customer Information</h4>
              <DetailRow label="Nama" value={selectedRO ? selectedRO.customer : '—'} />
              <DetailRow label="No. HP" value={selectedRO ? selectedRO.phone : '—'} />
              <DetailRow label="NIK" value={selectedRO ? selectedRO.nik : '—'} />
            </div>
            <div className="detail-block">
              <h4>Vehicle Information</h4>
              <div className="detail-row">
                <span>No. Mesin</span>
                <strong>{selectedRO ? selectedRO.engine : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Tipe Kendaraan</span>
                <strong>{selectedRO ? 'Honda Automatic / Sport' : '—'}</strong>
              </div>
            </div>
            <div className="detail-block">
              <h4>Repair Order Information</h4>
              <div className="detail-row">
                <span>No. R.O</span>
                <strong>{selectedRO ? selectedRO.roNumber : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>AHASS</span>
                <strong>{selectedRO ? selectedRO.ahass : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Tanggal</span>
                <strong>{selectedRO ? selectedRO.date : '—'}</strong>
              </div>
            </div>
            <div className="detail-block">
              <h4>Service Information</h4>
              <div className="detail-row">
                <span>Job</span>
                <strong>{selectedRO ? selectedRO.job : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <strong>{selectedRO ? selectedRO.status : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Biaya</span>
                <strong>{selectedRO ? `Rp ${selectedRO.cost.toLocaleString('id-ID')}` : '—'}</strong>
              </div>
            </div>
          </div>
          <div className="form-section" style={{ marginTop: '16px' }}>
            <h4>Checking Result</h4>
            <p className="empty-kpi-sub">
              {selectedRO
                ? `Data Repair Order ${selectedRO.roNumber} telah diverifikasi dengan status ${selectedRO.status}.`
                : 'Hasil pengecekan belum dapat diisi. Aturan validasi R.O belum ditetapkan.'}
            </p>
          </div>
          <div className="form-section">
            <h4>Additional Notes</h4>
            <p className="empty-kpi-sub">
              {selectedRO
                ? `Catatan AHASS: Servis diselesaikan tepat waktu sesuai standar bengkel resmi Honda.`
                : 'Catatan operasional akan tersedia setelah data R.O terhubung.'}
            </p>
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
