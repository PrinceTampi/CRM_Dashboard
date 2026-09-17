'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile } from '@/lib/crm-data';
import type { H3ActivateRecord } from '@/lib/definitions';

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
];

const matrixRows = [
  { metric: 'Data Source Customer', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Penjualan Part (Item)', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Total Revenue Part (Rp)', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Prospek Part (Follow Up)', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Deal Part Konsumen', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Conversion Rate', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
];

function NiguriStatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number | string;
  label: string;
  tone: 'teal' | 'blue' | 'green' | 'orange' | 'purple';
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

function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pagination-controls">
      <span className="page-info">Halaman {page} dari {totalPages}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button type="button" className="page-btn" disabled={page <= 1} onClick={onPrev}>&laquo;</button>
        <button type="button" className="page-btn active">{page}</button>
        <button type="button" className="page-btn" disabled={page >= totalPages} onClick={onNext}>&raquo;</button>
      </div>
    </div>
  );
}

export function NiguriView() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [page, setPage] = useState(1);
  const [actList, setActList] = useState<H3ActivateRecord[]>([]);
  const [totalAct, setTotalAct] = useState(0);
  const [terhubungCount, setTerhubungCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/niguri-h3?month=${selectedMonth}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!active) return;
        const rows = payload.rows ?? [];
        setActList(rows);
        setTotalAct(Number(payload.totalAct ?? rows.length));
        setTerhubungCount(Number(payload.terhubungCount ?? 0));
        setDealCount(Number(payload.dealCount ?? 0));
      } catch {
        if (active) {
          setActList([]);
          setTotalAct(0);
          setTerhubungCount(0);
          setDealCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [selectedMonth]);

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
          <NiguriStatCard icon="fa-boxes" value="—" label="Total Part Terjual" tone="teal" />
          <NiguriStatCard icon="fa-money-bill-wave" value="—" label="Total Penjualan Part" tone="blue" />
          <NiguriStatCard icon="fa-user-check" value="—" label="Total Prospect" tone="green" />
          <NiguriStatCard icon="fa-handshake" value="—" label="Deal / Konsumen" tone="orange" />
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
            <NiguriStatCard icon="fa-phone-alt" value={totalAct} label="Total Leads Activation" tone="blue" />
            <NiguriStatCard icon="fa-comment-dots" value={terhubungCount} label={`Terhubung (${pctConnect}%)`} tone="green" />
            <NiguriStatCard icon="fa-handshake" value={dealCount} label={`Deal (${pctDeal}%)`} tone="purple" />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
            Leads <span>{totalAct}</span> · Terhubung <span>{terhubungCount}</span> · Deal <span>{dealCount}</span> · Conversion <strong>{convRate}</strong> · Contribution <strong>—</strong> · DB H3 <span>—</span>
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
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      </div>
    </CrmShell>
  );
}
