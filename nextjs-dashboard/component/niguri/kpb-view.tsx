'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CrmShell } from '@/component/layout/crm-shell';

function addMonths(date: string, monthsToAdd: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + monthsToAdd);
  return value.toISOString().slice(0, 10);
}

export function KpbView({ kpbNumber }: { kpbNumber: number }) {
  const offsets = [2, 4, 8, 12];
  const offset = offsets[kpbNumber - 1] || offsets[0];
  const [invoiceDate, setInvoiceDate] = useState('2026-01-15');
  const [rows, setRows] = useState<Array<{ name: string; phone: string; motor: string; contact: string; progress: string }>>([]);
  const [loading, setLoading] = useState(true);
  const targetDate = addMonths(invoiceDate, offset);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const month = invoiceDate.slice(0, 7);
        const response = await fetch(`/api/niguri/h2?month=${month}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!active) return;
        setRows((payload.rows ?? []).slice(0, 12));
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [invoiceDate]);

  return (
    <CrmShell title={`Niguri H2 - KPB ${kpbNumber}`} crumb="Service & Part">
      <div className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>KPB {kpbNumber}</h2>
          <p>Follow-up service H+{offset} bulan yang dihitung dari tanggal faktur.</p>
        </div>
        <div className="filter-bar">
          <label htmlFor="kpbInvoiceDate">Tanggal Faktur</label>
          <input id="kpbInvoiceDate" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
          <span className="badge info">Target KPB {kpbNumber}: {targetDate}</span>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((number) => (
            <Link key={number} href={`/niguri/kpb/${number}`} className={`stat-card stat-static ${number === kpbNumber ? 'stat-primary' : ''}`}>
              <div className="stat-icon orange"><i className="fas fa-calendar-check" aria-hidden="true" /></div>
              <div className="stat-info"><div className="number">KPB {number}</div><div className="label">H+{offsets[number - 1]} bulan</div></div>
            </Link>
          ))}
        </div>
        <div className="card">
          <h3><i className="fas fa-table" aria-hidden="true" /> Data Niguri H2 KPB {kpbNumber}</h3>
          <div className="table-wrap">
            <table className="niguri-table">
              <thead><tr><th>Nama</th><th>No HP</th><th>Motor</th><th>Tanggal Faktur</th><th>Target KPB {kpbNumber}</th><th>Status FU</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>Memuat data...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>Belum ada data KPB untuk periode ini.</td></tr>
                ) : rows.map((row, index) => <tr key={`${row.phone}-${index}`}><td><strong>{row.name}</strong></td><td>{row.phone}</td><td>{row.motor || '-'}</td><td>{invoiceDate}</td><td>{targetDate}</td><td>{row.contact || 'Belum FU'}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <Link href="/niguri/h2" className="btn-sm primary" style={{ display: 'inline-flex' }}><i className="fas fa-arrow-left" aria-hidden="true" /> Kembali ke Niguri H2</Link>
      </div>
    </CrmShell>
  );
}
