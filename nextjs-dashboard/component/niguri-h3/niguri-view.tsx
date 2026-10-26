'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CrmShell, useCrmToast } from '@/component/layout/crm-shell';
import { copySpreadsheetToClipboard, downloadCsvFile } from '@/lib/crm-data';
import type { H3ActivateRecord } from '@/lib/definitions';

function getCurrentWitaMonth(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${year}-${month}`;
}

const initialMatrixRows = [
  { metric: 'Data Source Customer', h1_qty: '—', h1_pct: '—', h2_qty: '—', h2_pct: '—' },
  { metric: 'Penjualan Part (Item)', h1_qty: 'Belum terpetakan', h1_pct: '—', h2_qty: 'Belum terpetakan', h2_pct: '—' },
  { metric: 'Total Revenue Part (Rp)', h1_qty: 'Belum terpetakan', h1_pct: '—', h2_qty: 'Belum terpetakan', h2_pct: '—' },
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

function h23MatchLabel(status: H3ActivateRecord['h23Match']): string {
  switch (status) {
    case 'both': return 'Nama & No HP';
    case 'phone': return 'No HP sama';
    case 'name': return 'Nama sama';
    case 'conflict': return 'Nama & HP beda profil';
    case 'none': return 'Tidak ditemukan';
    case 'not_compared': return 'H23 belum tersedia';
  }
}

function h23MatchTone(status: H3ActivateRecord['h23Match']): string {
  if (status === 'both' || status === 'phone') return 'success';
  if (status === 'name' || status === 'conflict') return 'warning';
  return status === 'none' ? 'danger' : 'info';
}

export function NiguriView() {
  const { showToast } = useCrmToast();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentWitaMonth);
  const [page, setPage] = useState(1);
  const [actList, setActList] = useState<H3ActivateRecord[]>([]);
  const [totalAct, setTotalAct] = useState(0);
  const [terhubungCount, setTerhubungCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);
  const [h23ComparisonAvailable, setH23ComparisonAvailable] = useState(false);
  const [h23MatchCount, setH23MatchCount] = useState(0);
  const [h23PhoneMatchCount, setH23PhoneMatchCount] = useState(0);
  const [h23NameMatchCount, setH23NameMatchCount] = useState(0);
  const [h23NoMatchCount, setH23NoMatchCount] = useState(0);
  const [partQuantity, setPartQuantity] = useState(0);
  const [partRevenue, setPartRevenue] = useState(0);
  const [matrixRows, setMatrixRows] = useState(initialMatrixRows);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const pageSize = 10;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`/api/niguri-h3?month=${selectedMonth}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) throw new Error(payload?.message || 'Data Niguri H3 gagal dimuat.');
        if (!active) return;
        const rows = payload.rows ?? [];
        setActList(rows);
        setTotalAct(Number(payload.totalAct ?? rows.length));
        setTerhubungCount(Number(payload.terhubungCount ?? 0));
        setDealCount(Number(payload.dealCount ?? 0));
        setH23ComparisonAvailable(Boolean(payload.h23ComparisonAvailable));
        setH23MatchCount(Number(payload.h23MatchCount ?? 0));
        setH23PhoneMatchCount(Number(payload.h23PhoneMatchCount ?? 0));
        setH23NameMatchCount(Number(payload.h23NameMatchCount ?? 0));
        setH23NoMatchCount(Number(payload.h23NoMatchCount ?? 0));
        setPartQuantity(Number(payload.partQuantity ?? 0));
        setPartRevenue(Number(payload.partRevenue ?? 0));
        const h1Pipeline = payload.pipelines?.h1ToH3;
        const h2Pipeline = payload.pipelines?.h2ToH3;
        const totalPipelineLeads = Number(h1Pipeline?.leads ?? 0) + Number(h2Pipeline?.leads ?? 0);
        const share = (count: number) => totalPipelineLeads > 0 ? `${((count / totalPipelineLeads) * 100).toFixed(1)}%` : '—';
        setMatrixRows([
          { metric: 'Data Source Customer', h1_qty: String(h1Pipeline?.leads ?? 0), h1_pct: share(Number(h1Pipeline?.leads ?? 0)), h2_qty: String(h2Pipeline?.leads ?? 0), h2_pct: share(Number(h2Pipeline?.leads ?? 0)) },
          initialMatrixRows[1],
          initialMatrixRows[2],
          { metric: 'Prospek Part (Follow Up)', h1_qty: String(h1Pipeline?.leads ?? 0), h1_pct: share(Number(h1Pipeline?.leads ?? 0)), h2_qty: String(h2Pipeline?.leads ?? 0), h2_pct: share(Number(h2Pipeline?.leads ?? 0)) },
          { metric: 'Deal Part Konsumen', h1_qty: String(h1Pipeline?.deals ?? 0), h1_pct: h1Pipeline?.leads ? `${((h1Pipeline.deals / h1Pipeline.leads) * 100).toFixed(1)}%` : '—', h2_qty: String(h2Pipeline?.deals ?? 0), h2_pct: h2Pipeline?.leads ? `${((h2Pipeline.deals / h2Pipeline.leads) * 100).toFixed(1)}%` : '—' },
          { metric: 'Conversion Rate', h1_qty: '—', h1_pct: h1Pipeline?.leads ? `${((h1Pipeline.deals / h1Pipeline.leads) * 100).toFixed(1)}%` : '—', h2_qty: '—', h2_pct: h2Pipeline?.leads ? `${((h2Pipeline.deals / h2Pipeline.leads) * 100).toFixed(1)}%` : '—' },
        ]);
      } catch (error) {
        if (active) {
          setActList([]);
          setTotalAct(0);
          setTerhubungCount(0);
          setDealCount(0);
          setH23ComparisonAvailable(false);
          setH23MatchCount(0);
          setH23PhoneMatchCount(0);
          setH23NameMatchCount(0);
          setH23NoMatchCount(0);
          setPartQuantity(0);
          setPartRevenue(0);
          setMatrixRows(initialMatrixRows);
          setLoadError(error instanceof Error ? error.message : 'Data Niguri H3 gagal dimuat.');
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
      ['Nama', 'No HP', 'Status Contact', 'Status Deal', 'Waktu Upload (WITA)', 'Perbandingan H23'],
      actList.map((a) => [
        a.name,
        a.phone,
        a.contact,
        a.deal ?? '',
        a.date,
        h23MatchLabel(a.h23Match),
      ])
    );
  };

  const copySpreadsheet = async (headers: string[], rows: (string | number)[][]) => {
    try {
      await copySpreadsheetToClipboard(headers, rows);
      showToast('success', 'Data berhasil disalin. Silakan paste ke spreadsheet.');
    } catch {
      showToast('error', 'Data gagal disalin ke clipboard.');
    }
  };

  const handleCopyMatrix = () => {
    void copySpreadsheet(
      ['Metric', 'H1 to H3 Qty', 'H1 to H3 %', 'H2 to H3 Qty', 'H2 to H3 %'],
      matrixRows.map((r) => [r.metric, r.h1_qty, r.h1_pct, r.h2_qty, r.h2_pct])
    );
  };

  const handleCopyAct = () => {
    void copySpreadsheet(
      ['Nama', 'No HP', 'Status Contact', 'Status Deal', 'Waktu Upload (WITA)', 'Perbandingan H23'],
      actList.map((a) => [a.name, a.phone, a.contact, a.deal ?? '', a.date, h23MatchLabel(a.h23Match)])
    );
  };

  return (
    <CrmShell title="Niguri H3" crumb="Service & Part">
      <div id="niguri" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Niguri H3</h2>
          <p>Analisis prospek activation dan penjualan part H3, termasuk pencocokan nama atau nomor HP dengan pelanggan H23.</p>
        </div>
        {loadError && <div className="alert error" role="alert" style={{ marginBottom: '16px' }}>{loadError}</div>}

        <div className="filter-bar">
          <label htmlFor="niguriMonthFilter">
            <i className="fas fa-calendar-alt" aria-hidden="true" /> Bulan Waktu Upload:
          </label>
          <input
            type="month"
            id="niguriMonthFilter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
          />
          <span id="niguriDataCount">Menampilkan data periode {selectedMonth}</span>
        </div>

        <div className="stats-grid">
          <NiguriStatCard icon="fa-boxes" value={partQuantity.toLocaleString()} label="Total Part Terjual (Qty)" tone="teal" />
          <NiguriStatCard icon="fa-money-bill-wave" value={`Rp ${partRevenue.toLocaleString('id-ID')}`} label="Total Penjualan Part (Gross)" tone="blue" />
          <NiguriStatCard icon="fa-user-check" value={totalAct} label="Total Prospect Activation" tone="green" />
          <NiguriStatCard icon="fa-handshake" value={dealCount} label="Deal / Konsumen" tone="orange" />
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Data Source H2 to H1{' '}
            <button type="button" className="btn-download" onClick={handleCopyMatrix}>
              <i className="fas fa-copy" aria-hidden="true" /> Copy Spreadsheet
            </button>
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

          <div className="stats-grid">
            <NiguriStatCard icon="fa-database" value={h23ComparisonAvailable ? h23MatchCount : '—'} label="Ditemukan di H23" tone="teal" />
            <NiguriStatCard icon="fa-phone" value={h23ComparisonAvailable ? h23PhoneMatchCount : '—'} label="Nomor HP sama" tone="blue" />
            <NiguriStatCard icon="fa-user" value={h23ComparisonAvailable ? h23NameMatchCount : '—'} label="Nama sama" tone="purple" />
            <NiguriStatCard icon="fa-user-slash" value={h23ComparisonAvailable ? h23NoMatchCount : '—'} label="Tidak ditemukan di H23" tone="orange" />
          </div>
          {!loading && !h23ComparisonAvailable && !loadError && (
            <p role="status" style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
              Belum ada transaksi H23 di database. Perbandingan nama dan nomor HP akan tersedia setelah data H23 diimpor.
            </p>
          )}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
            Leads <span>{totalAct}</span> · Terhubung <span>{terhubungCount}</span> · Deal <span>{dealCount}</span> · Conversion <strong>{convRate}</strong>
          </p>

          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
            Detail Leads Activation{' '}
            <button type="button" className="btn-download" onClick={handleDownloadActCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
            <button type="button" className="btn-download" onClick={handleCopyAct}>
              <i className="fas fa-copy" aria-hidden="true" /> Copy Spreadsheet
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
                  <th>Waktu Upload (WITA)</th>
                  <th>Perbandingan H23</th>
                </tr>
              </thead>
              <tbody id="h3ActTableBody">
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Memuat data Niguri H3...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Data tidak dapat dimuat.</td></tr>
                ) : pagedAct.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data Niguri H3 pada bulan {selectedMonth}.</td></tr>
                ) : pagedAct.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.phone}</td>
                    <td>
                      <span className={`badge ${a.contact.toLowerCase().includes('terhubung') ? 'success' : 'danger'}`}>
                        {a.contact}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.deal?.trim().toLowerCase() === 'deal' ? 'success' : 'warning'}`}>
                        {a.deal ?? 'Belum tersedia'}
                      </span>
                    </td>
                    <td>{a.date}</td>
                    <td><span className={`badge ${h23MatchTone(a.h23Match)}`}>{h23MatchLabel(a.h23Match)}</span></td>
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
