'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile } from '@/lib/crm-data';
import type { H2Record } from '@/lib/definitions';

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-04', label: 'April 2026' },
];

const pageSize = 10;

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: 'blue' | 'green' | 'red' | 'pink' | 'cyan' | 'purple' | 'orange';
}) {
  return (
    <div className="stat-card stat-primary">
      <div className={`stat-icon ${tone}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <div className="stat-info">
        <div className="number">{value.toLocaleString()}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color }} />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

export function ExpressH2View() {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [page, setPage] = useState(1);
  const [fuList, setFuList] = useState<H2Record[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [terhubung, setTerhubung] = useState(0);
  const [eventAhass, setEventAhass] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/express-h2?month=${selectedMonth}`, { cache: 'no-store' });
        const payload = await response.json();

        if (!active) return;

        setFuList(payload.rows ?? []);
        setTotalLeads(Number(payload.totalLeads ?? 0));
        setTerhubung(Number(payload.terhubung ?? 0));
        setEventAhass(Number(payload.eventAhass ?? 0));
      } catch {
        if (active) {
          setFuList([]);
          setTotalLeads(0);
          setTerhubung(0);
          setEventAhass(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const tidakTerhubung = totalLeads - terhubung;
  const pctConnect = totalLeads > 0 ? ((terhubung / totalLeads) * 100).toFixed(1) : '0';
  const pctAhassVsConnect = terhubung > 0 ? ((eventAhass / terhubung) * 100).toFixed(1) : '0';
  const pctOverall = totalLeads > 0 ? ((eventAhass / totalLeads) * 100).toFixed(1) : '0';

  const totalPages = Math.max(1, Math.ceil(fuList.length / pageSize));
  const pagedFU = useMemo(() => {
    const start = (page - 1) * pageSize;
    return fuList.slice(start, start + pageSize);
  }, [fuList, page]);

  const handleDownloadCsv = () => {
    downloadCsvFile(
      `Hasil_FU_KPB_${selectedMonth}.csv`,
      ['Nama', 'No HP', 'Motor', 'Status Kontak', 'Hasil Call', 'Tanggal'],
      fuList.map((item) => [
        item.name,
        item.phone,
        item.motor || '-',
        item.contact || '-',
        item.progress || '-',
        item.date || '-',
      ])
    );
  };

  return (
    <CrmShell title="EKSPRES H2" crumb="Follow-up & Campaign">
      <div id="projecth2" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>EKSPRES H2</h2>
          <p>Monitoring hasil follow-up (FU) event AHASS.</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="h2MonthFilter">
            <i className="fas fa-calendar-alt" aria-hidden="true" /> Filter Bulan:
          </label>
          <select
            id="h2MonthFilter"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              setPage(1);
            }}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-sm primary" onClick={() => setPage(1)}>
            <i className="fas fa-filter" aria-hidden="true" /> Terapkan
          </button>
        </div>

        <div className="stats-grid">
          <StatCard label="Total Data FU Juli" value={totalLeads} icon="fa-user-friends" tone="blue" />
          <StatCard label="Terhubung (FU Juli)" value={terhubung} icon="fa-phone-alt" tone="green" />
          <StatCard label="Tidak Terhubung (FU Juli)" value={tidakTerhubung} icon="fa-phone-slash" tone="red" />
          <StatCard label="Total Event AHASS" value={eventAhass} icon="fa-calendar-day" tone="pink" />
        </div>

        <div className="stats-grid" style={{ marginTop: '12px' }}>
          <StatCard label="% Terhubung vs Total FU Juli" value={Number(pctConnect)} icon="fa-percent" tone="cyan" />
          <StatCard label="% Event AHASS vs Terhubung" value={Number(pctAhassVsConnect)} icon="fa-percent" tone="purple" />
          <StatCard label="Contribution Rate (Event AHASS vs DB)" value={Number(pctOverall)} icon="fa-percent" tone="orange" />
        </div>

        <div className="row-2col" style={{ marginTop: '16px' }}>
          <SectionCard title="Status Kontak">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span><i className="fas fa-check-circle" style={{ color: '#166534' }} /> Terhubung</span>
                <strong>{terhubung} ({pctConnect}%)</strong>
              </div>
              <ProgressBar value={Number(pctConnect)} color="#166534" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span><i className="fas fa-times-circle" style={{ color: '#991B1B' }} /> Tidak Terhubung</span>
                <strong>{tidakTerhubung} ({(100 - Number(pctConnect)).toFixed(1)}%)</strong>
              </div>
              <ProgressBar value={100 - Number(pctConnect)} color="#991B1B" />
            </div>
          </SectionCard>

          <SectionCard title="Progress FU">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span><i className="fas fa-calendar-check" style={{ color: '#0B1E33' }} /> Event AHASS Tercapai</span>
                <strong>{eventAhass} konsumen</strong>
              </div>
              <ProgressBar value={Math.min(100, (eventAhass / 300) * 100)} color="#0B1E33" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span><i className="fas fa-user-check" style={{ color: '#166534' }} /> Target Terhubung</span>
                <strong>{terhubung}/{totalLeads}</strong>
              </div>
              <ProgressBar value={totalLeads > 0 ? (terhubung / totalLeads) * 100 : 0} color="#166534" />
            </div>
          </SectionCard>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ marginBottom: '4px' }}>Data FU</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>
                Daftar hasil follow-up untuk periode {selectedMonth}
              </p>
            </div>
            <button type="button" className="btn-sm primary" onClick={handleDownloadCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </div>

          <div className="table-wrap" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>Motor</th>
                  <th>Status Kontak</th>
                  <th>Hasil Call</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Memuat data follow-up...
                    </td>
                  </tr>
                ) : pagedFU.length > 0 ? pagedFU.map((row, index) => (
                  <tr key={`${row.name}-${row.phone}-${index}`}>
                    <td>{row.name}</td>
                    <td>{row.phone}</td>
                    <td>{row.motor || '-'}</td>
                    <td>{row.contact || '-'}</td>
                    <td>{row.progress || '-'}</td>
                    <td>{row.date || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Tidak ada data follow-up pada bulan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {fuList.length > 0 && (
            <div className="pagination-controls" style={{ marginTop: '16px' }}>
              <span className="page-info">
                Halaman {page} dari {totalPages} ({fuList.length} data)
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  &laquo;
                </button>
                <button type="button" className="page-btn active">{page}</button>
                <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
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
