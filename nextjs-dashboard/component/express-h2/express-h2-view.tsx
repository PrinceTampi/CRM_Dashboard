'use client';

import React, { useState, useMemo } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { initialFuJuli, initialEventAhass, downloadCsvFile } from '@/lib/crm-data';
import type { H2Record } from '@/lib/definitions';

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-04', label: 'April 2026' },
];

export function ExpressH2View() {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter data
  const fuList = useMemo(() => {
    return initialFuJuli;
  }, [selectedMonth]);

  const totalLeads = fuList.length;
  const terhubung = useMemo(() => {
    return fuList.filter((d) => (d.contact || '').toLowerCase().includes('terhubung')).length;
  }, [fuList]);

  const tidakTerhubung = totalLeads - terhubung;
  const eventAhass = initialEventAhass.length;

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
      fuList.map((d) => [
        d.name,
        d.phone,
        d.motor || '-',
        d.contact || '-',
        d.progress || '-',
        d.date || '-',
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
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon blue">
              <i className="fas fa-user-friends" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{totalLeads.toLocaleString()}</div>
              <div className="label">Total Data FU Juli</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="fas fa-phone-alt" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{terhubung.toLocaleString()}</div>
              <div className="label">Terhubung (FU Juli)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">
              <i className="fas fa-phone-slash" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{tidakTerhubung.toLocaleString()}</div>
              <div className="label">Tidak Terhubung (FU Juli)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pink">
              <i className="fas fa-calendar-day" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{eventAhass.toLocaleString()}</div>
              <div className="label">Total Event AHASS</div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '12px' }}>
          <div className="stat-card stat-static">
            <div className="stat-icon cyan">
              <i className="fas fa-percent" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{pctConnect}%</div>
              <div className="label">% Terhubung vs Total FU Juli</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon purple">
              <i className="fas fa-percent" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{pctAhassVsConnect}%</div>
              <div className="label">% Event AHASS vs Terhubung</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon orange">
              <i className="fas fa-percent" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{pctOverall}%</div>
              <div className="label">Contribution Rate (Event AHASS vs DB)</div>
            </div>
          </div>
        </div>

        <div className="row-2col" style={{ marginTop: '16px' }}>
          <div className="card">
            <h3>Status Kontak</h3>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span><i className="fas fa-check-circle" style={{ color: '#166534' }} /> Terhubung</span>
                  <strong>{terhubung} ({pctConnect}%)</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${pctConnect}%`, height: '100%', background: '#166534' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span><i className="fas fa-times-circle" style={{ color: '#991B1B' }} /> Tidak Terhubung</span>
                  <strong>{tidakTerhubung} ({(100 - Number(pctConnect)).toFixed(1)}%)</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - Number(pctConnect)}%`, height: '100%', background: '#991B1B' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Progress FU</h3>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span><i className="fas fa-calendar-check" style={{ color: '#0B1E33' }} /> Event AHASS Tercapai</span>
                  <strong>{eventAhass} konsumen</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (eventAhass / 300) * 100)}%`, height: '100%', background: '#0B1E33' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span><i className="fas fa-bullseye" style={{ color: '#CC0000' }} /> Target Pencapaian (300)</span>
                  <strong>{((eventAhass / 300) * 100).toFixed(1)}%</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (eventAhass / 300) * 100)}%`, height: '100%', background: '#CC0000' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Detail Hasil FU KPB Juli{' '}
            <button type="button" className="btn-download" onClick={handleDownloadCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>Motor</th>
                  <th>Status Contact</th>
                  <th>Hasil Call</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {pagedFU.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.phone}</td>
                    <td>{d.motor || '-'}</td>
                    <td>
                      <span className={`badge ${d.contact?.toLowerCase().includes('terhubung') ? 'success' : 'danger'}`}>
                        {d.contact || 'Tidak Terhubung'}
                      </span>
                    </td>
                    <td>{d.progress || '-'}</td>
                    <td>{d.date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <span className="page-info">
              Halaman {page} dari {totalPages} ({fuList.length} data)
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
