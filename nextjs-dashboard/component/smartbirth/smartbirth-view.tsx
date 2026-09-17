'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile } from '@/lib/crm-data';

type BirthdayCustomer = {
  name: string;
  birth: string;
  phone: string;
};

type BirthdayFollowUp = {
  name: string;
  phone: string;
  contact: string;
  deal: string;
  date: string;
};

const monthOptions = [
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-05', label: 'Mei 2026' },
];

function StatCard({
  icon,
  value,
  label,
  tone,
  variant = 'default',
}: {
  icon: string;
  value: string | number;
  label: string;
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  variant?: 'default' | 'primary' | 'static';
}) {
  return (
    <div className={`stat-card ${variant === 'primary' ? 'stat-primary' : ''} ${variant === 'static' ? 'stat-static' : ''}`}>
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

function SectionAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="btn-download" onClick={onClick}>
      <i className="fas fa-download" aria-hidden="true" /> {label}
    </button>
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
      <span className="page-info">
        Halaman {page} dari {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button type="button" className="page-btn" disabled={page <= 1} onClick={onPrev}>&laquo;</button>
        <button type="button" className="page-btn active">{page}</button>
        <button type="button" className="page-btn" disabled={page >= totalPages} onClick={onNext}>&raquo;</button>
      </div>
    </div>
  );
}

export function SmartBirthView() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [bdayPage, setBdayPage] = useState(1);
  const [fuPage, setFuPage] = useState(1);
  const [birthdayCustomers, setBirthdayCustomers] = useState<BirthdayCustomer[]>([]);
  const [fuList, setFuList] = useState<BirthdayFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/smartbirth?month=${encodeURIComponent(selectedMonth)}`, {
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!active) return;
        setBirthdayCustomers(payload.birthdayCustomers ?? []);
        setFuList(payload.followUps ?? []);
      } catch {
        if (active) {
          setBirthdayCustomers([]);
          setFuList([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [selectedMonth]);

  const totalBirthday = birthdayCustomers.length;
  const buyersCount = 0;
  const convRate = totalBirthday > 0 ? ((buyersCount / totalBirthday) * 100).toFixed(1) : '0';
  const salesContribution = '—';

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

  const bfuTotal = fuList.length;
  const bfuTerhubung = fuList.filter((f) => f.contact.toLowerCase().includes('terhubung') || f.contact.toLowerCase().includes('dibalas')).length;
  const bfuDeal = fuList.filter((f) => f.deal.toLowerCase() === 'deal').length;
  const bfuConvRate = bfuTotal > 0 ? ((bfuDeal / bfuTotal) * 100).toFixed(1) + '%' : '0%';
  const bfuContribRate = '—';

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
            {loading ? 'Memuat data...' : `Menampilkan ${totalBirthday.toLocaleString()} konsumen ultah periode ini`}
          </span>
        </div>

        <div className="stats-grid">
          <StatCard icon="fa-birthday-cake" value={totalBirthday.toLocaleString()} label="Total Konsumen Ulang Tahun" tone="blue" variant="primary" />
          <StatCard icon="fa-shopping-cart" value={buyersCount} label="Pembeli (Pakai Promo)" tone="green" />
          <StatCard icon="fa-percent" value={`${convRate}%`} label="Conversion Rate" tone="orange" variant="static" />
          <StatCard icon="fa-hand-holding-usd" value={salesContribution} label="Sales Contribution" tone="purple" variant="static" />
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Detail Pembelian Konsumen Ulang Tahun{' '}
            <SectionAction label="Download CSV" onClick={handleDownloadSmartBirthCsv} />
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
                {pagedPurchasers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>
                      {loading ? 'Memuat data...' : 'Belum ada data konsumen ulang tahun untuk bulan ini.'}
                    </td>
                  </tr>
                ) : pagedPurchasers.map((p, i) => (
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
          <PaginationControls
            page={bdayPage}
            totalPages={totalBdayPages}
            onPrev={() => setBdayPage((p) => Math.max(1, p - 1))}
            onNext={() => setBdayPage((p) => Math.min(totalBdayPages, p + 1))}
          />
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <h3>
            <i className="fas fa-headset" aria-hidden="true" /> Hasil FU Ulang Tahun (Upload Manual)
          </h3>
          <div className="stats-grid">
            <StatCard icon="fa-users" value={totalBirthday.toLocaleString()} label="Ulang Tahun (database)" tone="blue" variant="static" />
            <StatCard icon="fa-motorcycle" value="—" label="Penjualan H1 bulan ini" tone="green" variant="static" />
            <StatCard icon="fa-phone-alt" value={bfuTotal} label="Total di-FU" tone="blue" />
            <StatCard icon="fa-comment-dots" value={bfuTerhubung} label={`Terhubung (${((bfuTerhubung / bfuTotal) * 100).toFixed(0)}%)`} tone="green" />
            <StatCard icon="fa-handshake" value={bfuDeal} label={`Deal (${((bfuDeal / bfuTotal) * 100).toFixed(0)}%)`} tone="purple" />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0' }}>
            Conversion <strong>{bfuConvRate}</strong> · Contribution <strong>{bfuContribRate}</strong> · FU count <span>{bfuTotal}</span> · Terhubung <span>{bfuTerhubung}</span> · Deal <span>{bfuDeal}</span>
          </p>

          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
            Detail Hasil FU Ulang Tahun{' '}
            <SectionAction label="Download CSV" onClick={handleDownloadFuCsv} />
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
                {fuList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>
                      {loading ? 'Memuat data...' : 'Belum ada data follow-up ulang tahun untuk bulan ini.'}
                    </td>
                  </tr>
                ) : fuList.map((f, i) => (
                  <tr key={i}>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.phone}</td>
                    <td>
                      <span className={`badge ${f.contact.toLowerCase().includes('terhubung') || f.contact.toLowerCase().includes('dibalas') ? 'success' : 'danger'}`}>
                        {f.contact}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${f.deal.toLowerCase() === 'deal' ? 'success' : 'warning'}`}>
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
