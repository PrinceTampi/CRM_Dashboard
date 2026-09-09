'use client';

import React, { useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

type RORow = {
  no: number;
  customer: string;
  phone: string;
  engine: string;
  roNumber: string;
  ahass: string;
  date: string;
  job: string;
  status: 'Belum Dicek' | 'Sudah Dicek' | 'Sesuai' | 'Tidak Sesuai' | 'Perlu Review';
  cost: number;
};

const sampleROs: RORow[] = [
  { no: 1, customer: 'ANWAR BOLONGGODU', phone: '08129059192', engine: 'JFD2E 2447800', roNumber: 'RO-2026-0819', ahass: 'AHASS Malalayang', date: '2026-08-14', job: 'Paket Servis Lengkap + Ganti Oli', status: 'Sesuai', cost: 145000 },
  { no: 2, customer: 'MELLISA CHRISTINE KAWATAK', phone: '081340127083', engine: 'JFD2E 2538035', roNumber: 'RO-2026-0820', ahass: 'AHASS Kombos', date: '2026-08-14', job: 'Servis Ringan + Kampas Rem', status: 'Sudah Dicek', cost: 85000 },
  { no: 3, customer: 'JEINNY SARAUN', phone: '081356666595', engine: 'JFB1E 2042104', roNumber: 'RO-2026-0821', ahass: 'AHASS Paal Dua', date: '2026-08-15', job: 'Ganti CVT Belt & Roller', status: 'Perlu Review', cost: 210000 },
  { no: 4, customer: 'SILVA MANGUNDAP', phone: '085340127588', engine: 'JFP1E 1176207', roNumber: 'RO-2026-0822', ahass: 'AHASS Tuminting', date: '2026-08-15', job: 'Tune Up Injeksi', status: 'Belum Dicek', cost: 65000 },
];

export function PortalOverview() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedRO, setSelectedRO] = useState<RORow | null>(sampleROs[0]);

  const filteredROs = sampleROs.filter((ro) => {
    const matchCust = !customerSearch || ro.customer.toLowerCase().includes(customerSearch.toLowerCase()) || ro.phone.includes(customerSearch) || ro.roNumber.toLowerCase().includes(customerSearch.toLowerCase());
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
              placeholder="Nama, No HP, atau No RO"
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
          <div className="stat-card stat-static">
            <div className="stat-icon blue">
              <i className="fas fa-file-invoice" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{sampleROs.length}</div>
              <div className="label">Total R.O</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon green">
              <i className="fas fa-check" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{sampleROs.filter((r) => r.status === 'Sesuai').length}</div>
              <div className="label">R.O Terverifikasi</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon orange">
              <i className="fas fa-hourglass-half" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{sampleROs.filter((r) => r.status === 'Belum Dicek').length}</div>
              <div className="label">R.O Belum Dicek</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon red">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{sampleROs.filter((r) => r.status === 'Perlu Review').length}</div>
              <div className="label">R.O Bermasalah / Review</div>
            </div>
          </div>
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
                {filteredROs.map((ro) => (
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
                    <td><code>{ro.engine}</code></td>
                    <td><strong>{ro.roNumber}</strong></td>
                    <td>{ro.ahass}</td>
                    <td>{ro.date}</td>
                    <td>{ro.job}</td>
                    <td>
                      <span
                        className={`badge ${
                          ro.status === 'Sesuai'
                            ? 'success'
                            : ro.status === 'Perlu Review'
                            ? 'danger'
                            : 'warning'
                        }`}
                      >
                        {ro.status}
                      </span>
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
                {filteredROs.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <i className="fas fa-clipboard" />
                        <strong>Tidak ada data Repair Order yang cocok</strong>
                        <p>Ubah kata kunci filter pencarian di atas untuk melihat data.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls" aria-hidden="true">
            <span className="page-info">Menampilkan {filteredROs.length} dari {sampleROs.length} R.O</span>
          </div>
        </div>

        <div className="card">
          <h3>Pratinjau detail R.O</h3>
          <div className="detail-grid">
            <div className="detail-block">
              <h4>Customer Information</h4>
              <div className="detail-row">
                <span>Nama</span>
                <strong>{selectedRO ? selectedRO.customer : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>No. HP</span>
                <strong>{selectedRO ? selectedRO.phone : '—'}</strong>
              </div>
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
