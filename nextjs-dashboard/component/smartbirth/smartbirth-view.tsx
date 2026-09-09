'use client';

import React, { useState, useMemo } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { initialBirthdayMaster, initialBirthdayFu, getBirthdaysForMonth, downloadCsvFile } from '@/lib/crm-data';
import type { BirthdayFuRecord } from '@/lib/definitions';

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
];

export function SmartBirthView() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [bdayPage, setBdayPage] = useState(1);
  const [fuPage, setFuPage] = useState(1);
  const pageSize = 10;

  // Birthday buyers simulated
  const birthdayCustomers = useMemo(() => {
    return getBirthdaysForMonth(initialBirthdayMaster, selectedMonth);
  }, [selectedMonth]);

  const totalBirthday = birthdayCustomers.length;
  // Let's create realistic buyers count
  const buyersCount = Math.round(totalBirthday * 0.08); // 8% conversion
  const convRate = totalBirthday > 0 ? ((buyersCount / totalBirthday) * 100).toFixed(1) : '0';
  const salesContribution = '14.2%';

  // Detailed rows for birthday purchasers
  const birthdayPurchasers = useMemo(() => {
    return birthdayCustomers.slice(0, 100).map((c, i) => {
      const usesPromo = i % 4 === 0;
      const spend = usesPromo ? 17500000 + (i % 5) * 1500000 : 0;
      return {
        ...c,
        usesPromo: usesPromo ? 'Ya' : 'Tidak',
        spend,
      };
    });
  }, [birthdayCustomers]);

  const totalBdayPages = Math.max(1, Math.ceil(birthdayPurchasers.length / pageSize));
  const pagedPurchasers = useMemo(() => {
    const start = (bdayPage - 1) * pageSize;
    return birthdayPurchasers.slice(start, start + pageSize);
  }, [birthdayPurchasers, bdayPage]);

  // FU manual records
  const fuList = initialBirthdayFu;
  const bfuTotal = fuList.length;
  const bfuTerhubung = fuList.filter((f) => f.contact.toLowerCase().includes('terhubung') || f.contact.toLowerCase().includes('dibalas')).length;
  const bfuDeal = fuList.filter((f) => f.deal.toLowerCase() === 'deal').length;
  const bfuConvRate = bfuTotal > 0 ? ((bfuDeal / bfuTotal) * 100).toFixed(1) + '%' : '0%';
  const bfuContribRate = '3.8%';

  const handleDownloadSmartBirthCsv = () => {
    downloadCsvFile(
      `Pembelian_Konsumen_Ultah_${selectedMonth}.csv`,
      ['Nama', 'Tanggal Lahir', 'No HP', 'Menggunakan Promo', 'Total Belanja (Rp)'],
      birthdayPurchasers.map((p) => [p.name, p.birth, p.phone, p.usesPromo, p.spend])
    );
  };

  const handleDownloadFuCsv = () => {
    downloadCsvFile(
      `Hasil_FU_Ulang_Tahun_${selectedMonth}.csv`,
      ['Nama', 'No HP', 'Status Contact', 'Status Deal', 'Tanggal FU'],
      fuList.map((f) => [f.name, f.phone, f.contact, f.deal, f.date])
    );
  };

  return (
    <CrmShell title="SMART BIRTH" crumb="Follow-up & Campaign">
      <div id="smartbirth" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>SMART BIRTH</h2>
          <p>Performa promo ulang tahun dan hasil follow-up dibanding penjualan H1.</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="h1MonthFilter">
            <i className="fas fa-calendar-alt" aria-hidden="true" /> Filter Bulan (data H1):
          </label>
          <select
            id="h1MonthFilter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setBdayPage(1);
            }}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-sm primary" onClick={() => setBdayPage(1)}>
            <i className="fas fa-filter" aria-hidden="true" /> Terapkan
          </button>
          <span id="smartBirthDataCount">
            Menampilkan {totalBirthday.toLocaleString()} konsumen ultah periode ini
          </span>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon blue">
              <i className="fas fa-birthday-cake" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{totalBirthday.toLocaleString()}</div>
              <div className="label">Total Konsumen Ulang Tahun</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="fas fa-shopping-cart" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{buyersCount}</div>
              <div className="label">Pembeli (Pakai Promo)</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon orange">
              <i className="fas fa-percent" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{convRate}%</div>
              <div className="label">Conversion Rate</div>
            </div>
          </div>
          <div className="stat-card stat-static">
            <div className="stat-icon purple">
              <i className="fas fa-hand-holding-usd" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{salesContribution}</div>
              <div className="label">Sales Contribution</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Detail Pembelian Konsumen Ulang Tahun{' '}
            <button type="button" className="btn-download" onClick={handleDownloadSmartBirthCsv}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Tanggal Lahir</th>
                  <th>No HP</th>
                  <th>Menggunakan Promo</th>
                  <th>Total Belanja (Rp)</th>
                </tr>
              </thead>
              <tbody id="smartBirthTableBody">
                {pagedPurchasers.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.birth}</td>
                    <td>{p.phone}</td>
                    <td>
                      <span className={`badge ${p.usesPromo === 'Ya' ? 'success' : 'info'}`}>
                        {p.usesPromo}
                      </span>
                    </td>
                    <td>
                      {p.spend > 0 ? `Rp ${p.spend.toLocaleString('id-ID')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <span className="page-info">
              Halaman {bdayPage} dari {totalBdayPages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="page-btn"
                disabled={bdayPage <= 1}
                onClick={() => setBdayPage((p) => Math.max(1, p - 1))}
              >
                &laquo;
              </button>
              <button type="button" className="page-btn active">
                {bdayPage}
              </button>
              <button
                type="button"
                className="page-btn"
                disabled={bdayPage >= totalBdayPages}
                onClick={() => setBdayPage((p) => Math.min(totalBdayPages, p + 1))}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-headset" aria-hidden="true" /> Hasil FU Ulang Tahun (Upload Manual)
          </h3>
          <div className="stats-grid">
            <div className="stat-card stat-static">
              <div className="stat-icon blue">
                <i className="fas fa-users" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{totalBirthday.toLocaleString()}</div>
                <div className="label">Ulang Tahun (database)</div>
              </div>
            </div>
            <div className="stat-card stat-static">
              <div className="stat-icon cyan">
                <i className="fas fa-motorcycle" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">312</div>
                <div className="label">Penjualan H1 bulan ini</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <i className="fas fa-phone-alt" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{bfuTotal}</div>
                <div className="label">Total di-FU</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <i className="fas fa-comment-dots" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{bfuTerhubung}</div>
                <div className="label">Terhubung ({((bfuTerhubung / bfuTotal) * 100).toFixed(0)}%)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <i className="fas fa-handshake" aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="number">{bfuDeal}</div>
                <div className="label">Deal ({((bfuDeal / bfuTotal) * 100).toFixed(0)}%)</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
            Conversion <strong>{bfuConvRate}</strong> · Contribution <strong>{bfuContribRate}</strong> · FU count <span>{bfuTotal}</span> · Terhubung <span>{bfuTerhubung}</span> · Deal <span>{bfuDeal}</span>
          </p>

          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
            Detail Hasil FU Ulang Tahun{' '}
            <button type="button" className="btn-download" onClick={handleDownloadFuCsv}>
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
                  <th>Tanggal FU</th>
                </tr>
              </thead>
              <tbody>
                {fuList.map((f, i) => (
                  <tr key={i}>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.phone}</td>
                    <td>
                      <span className={`badge ${f.contact.toLowerCase().includes('terhubung') || f.contact.toLowerCase().includes('dibalas') ? 'success' : 'danger'}`}>
                        {f.contact}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${f.deal === 'Deal' ? 'success' : 'warning'}`}>
                        {f.deal}
                      </span>
                    </td>
                    <td>{f.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
