'use client';

import React from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

export function MonitoringRcrView() {
  return (
    <CrmShell title="Monitoring RCR" crumb="Customer Performance">
      <div id="monitoringrcr" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Monitoring RCR</h2>
          <p>Monitoring performa repeat customer. Formula, target, dan definisi bisnis belum ditetapkan.</p>
        </div>

        <div className="kpi-hint">
          <i className="fas fa-circle-info" aria-hidden="true" /> RCR, definisi repeat customer, target, threshold, periode, dan grouping dealer belum dikonfirmasi. Kartu dan grafik tidak menampilkan angka fiktif.
        </div>

        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="rcrPeriod">Period</label>
            <select id="rcrPeriod" disabled>
              <option>Belum ditetapkan</option>
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="rcrMonth">Month</label>
            <select id="rcrMonth" disabled>
              <option value="2026-08">Agustus 2026</option>
              <option value="2026-07">Juli 2026</option>
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="rcrDealer">Dealer / AHASS</label>
            <select id="rcrDealer" disabled>
              <option>Semua</option>
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="rcrSegment">Customer Segment</label>
            <select id="rcrSegment" disabled>
              <option>Semua</option>
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="rcrCategory">Service Category</label>
            <select id="rcrCategory" disabled>
              <option>Semua</option>
            </select>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-static stat-primary">
            <div className="stat-icon red">
              <i className="fas fa-percent" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number empty-kpi">—</div>
              <div className="label">RCR</div>
              <div className="empty-kpi-sub">Data belum tersedia</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon blue">
              <i className="fas fa-users" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number empty-kpi">—</div>
              <div className="label">Total Customer</div>
              <div className="empty-kpi-sub">Data belum tersedia</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon green">
              <i className="fas fa-user-check" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number empty-kpi">—</div>
              <div className="label">Repeat Customer</div>
              <div className="empty-kpi-sub">Data belum tersedia</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon orange">
              <i className="fas fa-arrow-trend-up" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number empty-kpi">—</div>
              <div className="label">Growth / Comparison</div>
              <div className="empty-kpi-sub">Data belum tersedia</div>
            </div>
          </div>
        </div>

        <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Period</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>—</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→ Stable · perbandingan belum tersedia</div>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Previous Period</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>—</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Indikator ↑ / ↓ hanya aktif setelah data perbandingan tersedia</div>
          </div>
        </div>

        <div className="card">
          <h3>Tren RCR (siap untuk data aktual)</h3>
          <div
            className="chart-container"
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F9FAFB',
              borderRadius: '6px',
              border: '1px dashed var(--border)',
            }}
          >
            <div id="rcrChartEmpty" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              <i className="fas fa-chart-line" style={{ marginRight: '6px' }} />
              Data belum tersedia. Formula RCR belum ditetapkan.
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>Detail RCR</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Dealer / AHASS</th>
                  <th style={{ textAlign: 'right' }}>Total Customer</th>
                  <th style={{ textAlign: 'right' }}>Repeat Customer</th>
                  <th style={{ textAlign: 'right' }}>RCR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
                      <i className="fas fa-chart-line" style={{ fontSize: '28px', color: 'var(--text-muted)', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>Tidak ada baris performa</div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        Tabel ini akan menampilkan periode, dealer, total customer, repeat customer, dan RCR setelah definisi bisnis dan sumber data tersedia.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
