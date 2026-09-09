'use client';

import React, { useState, useMemo } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { initialH3Activate, downloadCsvFile } from '@/lib/crm-data';
import type { H3ActivateRecord } from '@/lib/definitions';

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
];

const matrixRows = [
  { metric: 'Data Source Customer', h1_qty: 312, h1_pct: '100%', h2_qty: 245, h2_pct: '100%' },
  { metric: 'Penjualan Part (Item)', h1_qty: 184, h1_pct: '59.0%', h2_qty: 156, h2_pct: '63.7%' },
  { metric: 'Total Revenue Part (Rp)', h1_qty: '24.850.000', h1_pct: '—', h2_qty: '18.420.000', h2_pct: '—' },
  { metric: 'Prospek Part (Follow Up)', h1_qty: 94, h1_pct: '30.1%', h2_qty: 78, h2_pct: '31.8%' },
  { metric: 'Deal Part Konsumen', h1_qty: 62, h1_pct: '19.9%', h2_qty: 54, h2_pct: '22.0%' },
  { metric: 'Conversion Rate', h1_qty: '19.9%', h1_pct: '—', h2_qty: '22.0%', h2_pct: '—' },
];

export function NiguriView() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const actList = initialH3Activate;
  const totalAct = actList.length;
  const terhubungCount = actList.filter((a) => (a.contact || '').toLowerCase().includes('terhubung')).length;
  const dealCount = Math.round(terhubungCount * 0.45);

  const pctConnect = totalAct > 0 ? ((terhubungCount / totalAct) * 100).toFixed(0) : '0';
  const pctDeal = totalAct > 0 ? ((dealCount / totalAct) * 100).toFixed(0) : '0';
  const convRate = totalAct > 0 ? ((dealCount / totalAct) * 100).toFixed(1) + '%' : '0%';

  const totalPages = Math.max(1, Math.ceil(actList.length / pageSize));
  const pagedAct = useMemo(() => {
    const start = (page - 1) * pageSize;
    return actList.slice(start, start + pageSize);
  }, [actList, page]);

  const handleDownloadMatrixCsv = () => {
    downloadCsvFile(
      `Matrix_H2_to_H1_${selectedMonth}.csv`,
      ['Metric', 'H1 to H3 Qty', 'H1 to H3 %', 'H2 to H3 Qty', 'H2 to H3 %'],
      matrixRows.map((r) => [r.metric, r.h1_qty, r.h1_pct, r.h2_qty, r.h2_pct])
    );
  };

  const handleDownloadActCsv = () => {
    downloadCsvFile(
      `Report_H3_Activation_${selectedMonth}.csv`,
      ['Nama', 'No HP', 'Status Contact', 'Status Deal', 'Tanggal Upload'],
      actList.map((a, i) => [
        a.name,
        a.phone,
        a.contact,
        i % 2 === 0 ? 'Deal' : 'Follow Up',
        a.date,
      ])
    );
  };

  return (
    <CrmShell title="Niguri H3" crumb="Service & Part">
      <div id="niguri" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Niguri H3</h2>
          <p>Analisis data sparepart dari sumber H3. Menampilkan metrik penjualan part, prospek, dan konversi.</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="niguriMonthFilter">
            <i className="fas fa-calendar-alt" aria-hidden="true" /> Filter Bulan:
          </label>
          <select
            id="niguriMonthFilter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-sm primary" onClick={() => setPage(1)}>
            <i className="fas fa-filter" aria-hidden="true" /> Terapkan
          </button>
          <span id="niguriDataCount">Menampilkan data periode {selectedMonth}</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon teal">
              <i className="fas fa-boxes" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">340</div>
              <div className="label">Total Part Terjual</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <i className="fas fa-money-bill-wave" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">Rp 43.270.000</div>
              <div className="label">Total Penjualan Part</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="fas fa-user-check" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">172</div>
              <div className="label">Total Prospect</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <i className="fas fa-handshake" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">116</div>
              <div className="label">Deal / Konsumen</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Data Source H2 to H1{' '}
            <button type="button" className="btn-download" onClick={handleDownloadMatrixCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </h3>
          <div className="table-wrap">
            <table className="niguri-table">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: 'middle', width: '32%' }}>Metric</th>
                  <th colSpan={2} style={{ textAlign: 'center' }}>H1 to H3</th>
                  <th colSpan={2} style={{ textAlign: 'center' }}>H2 to H3</th>
                </tr>
                <tr>
                  <th style={{ textAlign: 'center', fontWeight: 500, fontSize: '12px' }}>Qty</th>
                  <th style={{ textAlign: 'center', fontWeight: 500, fontSize: '12px' }}>%</th>
                  <th style={{ textAlign: 'center', fontWeight: 500, fontSize: '12px' }}>Qty</th>
                  <th style={{ textAlign: 'center', fontWeight: 500, fontSize: '12px' }}>%</th>
                </tr>
              </thead>
              <tbody id="niguriTableBody">
                {matrixRows.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.metric}</strong></td>
                    <td style={{ textAlign: 'center' }}>{r.h1_qty}</td>
                    <td style={{ textAlign: 'center' }}>{r.h1_pct}</td>
                    <td style={{ textAlign: 'center' }}>{r.h2_qty}</td>
                    <td style={{ textAlign: 'center' }}>{r.h2_pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-boxes" aria-hidden="true" /> Report H3 - Deal Prospek Sparepart (Upload Manual)
          </h3>
          <div className="stats-grid">
            <div className="stat-card stat-static">
              <div className="stat-icon blue">
                <i className="fas fa-phone-alt" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{totalAct}</div>
                <div className="label">Total Leads Activation</div>
              </div>
            </div>
            <div className="stat-card stat-static">
              <div className="stat-icon green">
                <i className="fas fa-comment-dots" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{terhubungCount}</div>
                <div className="label">Terhubung ({pctConnect}%)</div>
              </div>
            </div>
            <div className="stat-card stat-static">
              <div className="stat-icon purple">
                <i className="fas fa-handshake" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{dealCount}</div>
                <div className="label">Deal ({pctDeal}%)</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
            Leads <span>{totalAct}</span> · Terhubung <span>{terhubungCount}</span> · Deal <span>{dealCount}</span> · Conversion <strong>{convRate}</strong> · Contribution <strong>26.8%</strong> · DB H3 <span>177.473</span>
          </p>

          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
            Detail Leads Activation{' '}
            <button type="button" className="btn-download" onClick={handleDownloadActCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>Status Contact</th>
                  <th>Status Deal</th>
                  <th>Tanggal Upload</th>
                </tr>
              </thead>
              <tbody id="h3ActTableBody">
                {pagedAct.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.phone}</td>
                    <td>
                      <span className={`badge ${a.contact.toLowerCase().includes('terhubung') ? 'success' : 'danger'}`}>
                        {a.contact}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${i % 2 === 0 ? 'success' : 'warning'}`}>
                        {i % 2 === 0 ? 'Deal' : 'Follow Up'}
                      </span>
                    </td>
                    <td>{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <span className="page-info">
              Halaman {page} dari {totalPages}
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
        </div>
      </div>
    </CrmShell>
  );
}
