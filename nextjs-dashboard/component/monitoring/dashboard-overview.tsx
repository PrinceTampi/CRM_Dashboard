'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CrmShell, useCrmModal } from '@/component/layout/crm-shell';
import {
  calculateAge,
  getBirthdayStatus,
  downloadCsvFile,
} from '@/lib/crm-data';
import { getClientErrorMessage, safeFetchJson } from '@/lib/client-safe';

type DashboardBirthday = {
  name: string;
  birth: string;
  phone: string;
};

type DashboardEvent = {
  name: string;
  phone: string;
  engine: string;
  location?: string | null;
  notes?: string | null;
  date: string;
};

type DashboardRepairOrder = {
  no: number;
  customer: string;
  phone: string;
  nik: string;
  engine: string;
  roNumber: string;
  ahass: string;
  date: string;
  job: string;
  status: string;
  cost: number;
};

type DashboardSummary = {
  totalCustomers: number;
  birthdayTodayCount: number;
  birthdayMonthCount: number;
  birthdayTodayList: DashboardBirthday[];
  birthdayList: DashboardBirthday[];
  eventList: DashboardEvent[];
  monthlyRepairOrders: DashboardRepairOrder[];
  roByAhass: Array<{ ahass: string; count: number }>;
  salesTrend: Array<{ month: string; count: number }>;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - index);
  return {
    value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date),
  };
});

export function DashboardOverview() {
  const { openModal } = useCrmModal();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bdayPage, setBdayPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setLoading(true);

      try {
        const { data, error } = await safeFetchJson<DashboardSummary>(
          `/api/monitoring/summary?month=${encodeURIComponent(selectedMonth)}`,
          { cache: 'no-store' },
          { totalCustomers: 0, birthdayTodayCount: 0, birthdayMonthCount: 0, birthdayTodayList: [], birthdayList: [], eventList: [], monthlyRepairOrders: [], roByAhass: [], salesTrend: [] }
        );

        if (!active) return;

        if (error) {
          throw new Error(error);
        }

        setSummary(data ?? {
          totalCustomers: 0,
          birthdayTodayCount: 0,
          birthdayMonthCount: 0,
          birthdayTodayList: [],
          birthdayList: [],
          eventList: [],
          monthlyRepairOrders: [],
          roByAhass: [],
          salesTrend: [],
        });
      } catch (error) {
        if (active) {
          console.error('Monitoring summary load error:', getClientErrorMessage(error));
          setSummary({
            totalCustomers: 0,
            birthdayTodayCount: 0,
            birthdayMonthCount: 0,
            birthdayTodayList: [],
            birthdayList: [],
            eventList: [],
            monthlyRepairOrders: [],
            roByAhass: [],
            salesTrend: [],
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const birthdayList = summary?.birthdayList ?? [];
  const birthdayTodayList = summary?.birthdayTodayList ?? [];
  const totalMasterCount = summary?.totalCustomers ?? 0;
  const birthdayTodayCount = summary?.birthdayTodayCount ?? 0;
  const totalMonthBirthdays = summary?.birthdayMonthCount ?? 0;
  const eventList = summary?.eventList ?? [];
  const eventCount = eventList.length;
  const monthlyRepairOrders = summary?.monthlyRepairOrders ?? [];
  const roByAhass = summary?.roByAhass ?? [];
  const salesMonthly = summary?.salesTrend ?? [];

  // Pagination for birthday table
  const totalBdayPages = Math.max(1, Math.ceil(birthdayList.length / pageSize));
  const pagedBirthdays = useMemo(() => {
    const start = (bdayPage - 1) * pageSize;
    return birthdayList.slice(start, start + pageSize);
  }, [birthdayList, bdayPage]);

  // Pagination for all events table
  const totalEventPages = Math.max(1, Math.ceil(eventList.length / pageSize));
  const pagedEvents = useMemo(() => {
    const start = (eventPage - 1) * pageSize;
    return eventList.slice(start, start + pageSize);
  }, [eventList, eventPage]);

  const recentEvents = eventList.slice(-3).reverse();

  const handleDownloadBirthdayCsv = () => {
    downloadCsvFile(
      `Konsumen_Ultah_${selectedMonth}.csv`,
      ['Nama', 'Tanggal Lahir', 'No HP', 'Usia', 'Status'],
      birthdayList.map((c) => [
        c.name,
        c.birth,
        c.phone,
        calculateAge(c.birth),
        getBirthdayStatus(c.birth),
      ])
    );
  };

  const handleDownloadEventCsv = () => {
    downloadCsvFile(
      'Seluruh_Data_Event.csv',
      ['Nama', 'No HP', 'No Mesin', 'Lokasi', 'Catatan', 'Tanggal Input'],
      eventList.map((e) => [
        e.name,
        e.phone,
        e.engine,
        e.location || '-',
        e.notes || '-',
        e.date,
      ])
    );
  };

  const openCardModal = (type: 'total' | 'today' | 'month' | 'event') => {
    if (type === 'total') {
      openModal(
        `Total Konsumen Master (${totalMasterCount.toLocaleString('id-ID')} data)`,
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tanggal Lahir</th>
                <th>No HP</th>
              </tr>
            </thead>
            <tbody>
              {birthdayList.slice(0, 50).map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.birth}</td>
                  <td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Menampilkan data master konsumen CRM ({totalMasterCount.toLocaleString('id-ID')} data terdaftar).
          </p>
        </div>,
        () =>
          downloadCsvFile(
            'Master_Konsumen.csv',
            ['Nama', 'Tanggal Lahir', 'No HP'],
            birthdayList.map((c) => [c.name, c.birth, c.phone])
          )
      );
    } else if (type === 'today') {
      openModal(
        `Konsumen Ulang Tahun Hari Ini (${birthdayTodayCount} orang)`,
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tanggal Lahir</th>
                <th>No HP</th>
              </tr>
            </thead>
            <tbody>
              {birthdayTodayList.slice(0, 10).map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.birth}</td>
                  <td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        handleDownloadBirthdayCsv
      );
    } else if (type === 'month') {
      openModal(
        `Ulang Tahun Periode ${selectedMonth} (${totalMonthBirthdays.toLocaleString('id-ID')} orang)`,
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tanggal Lahir</th>
                <th>No HP</th>
              </tr>
            </thead>
            <tbody>
              {birthdayList.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.birth}</td>
                  <td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        handleDownloadBirthdayCsv
      );
    } else if (type === 'event') {
      openModal(
        `Registrasi Event AHASS (${eventList.length} data)`,
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>No HP</th>
                <th>No Mesin</th>
                <th>Lokasi</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((e, i) => (
                <tr key={i}>
                  <td>{e.name}</td>
                  <td>{e.phone}</td>
                  <td>{e.engine}</td>
                  <td>{e.location || '-'}</td>
                  <td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        handleDownloadEventCsv
      );
    }
  };

  const maxSales = Math.max(0, ...salesMonthly.map((s) => s.count));

  return (
    <CrmShell title="Monitoring" crumb="Main">
      <div id="monitoring" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Monitoring</h2>
          <p>Ringkasan operasional pelanggan, ulang tahun, dan registrasi event AHASS.</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="monitoringMonthFilter">
            <i className="fas fa-calendar-alt" aria-hidden="true" /> Filter Bulan (Ulang Tahun):
          </label>
          <select
            id="monitoringMonthFilter"
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
          <button
            type="button"
            className="btn-sm primary"
            onClick={() => setBdayPage(1)}
          >
            <i className="fas fa-filter" aria-hidden="true" /> Terapkan
          </button>
          <span id="monitoringDataCount">
            Menampilkan data {totalMonthBirthdays.toLocaleString('id-ID')} konsumen
          </span>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-primary" onClick={() => openCardModal('total')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon blue">
              <i className="fas fa-users" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number" id="totalCustomers">
                {totalMasterCount.toLocaleString('id-ID')}
              </div>
              <div className="label">Total Konsumen (Master)</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => openCardModal('today')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon orange">
              <i className="fas fa-birthday-cake" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number" id="birthdayToday">
                {birthdayTodayCount}
              </div>
              <div className="label">Ulang Tahun Hari Ini</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => openCardModal('month')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon green">
              <i className="fas fa-calendar-week" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number" id="birthdayMonth">
                {totalMonthBirthdays.toLocaleString('id-ID')}
              </div>
              <div className="label" id="birthdayMonthLabel">
                Ulang Tahun Bulan Ini
              </div>
            </div>
          </div>

          <div className="stat-card" onClick={() => openCardModal('event')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon purple">
              <i className="fas fa-user-plus" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number" id="eventCount">
                {eventCount}
              </div>
              <div className="label">Registrasi Event (Aktif)</div>
            </div>
          </div>

          <div className="stat-card stat-static">
            <div className="stat-icon red">
              <i className="fas fa-file-invoice" aria-hidden="true" />
            </div>
            <div className="stat-info">
              <div className="number">{monthlyRepairOrders.length}</div>
              <div className="label">RO Bulanan Ganti (AHASS)</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3><i className="fas fa-wrench" aria-hidden="true" /> RO Bulanan per AHASS</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>AHASS</th><th style={{ textAlign: 'right' }}>Jumlah RO Ganti</th><th>Status Pengecekan</th></tr></thead>
              <tbody>
                {roByAhass.map(({ ahass, count }) => (
                  <tr key={ahass}>
                    <td><strong>{ahass}</strong></td>
                    <td className="num">{count}</td>
                    <td><span className="badge info">Tersedia di Pengecekan RO</span></td>
                  </tr>
                ))}
                {roByAhass.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">Belum ada RO pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="row-2col">
          <div className="card">
            <h3>
              <i className="fas fa-gift" aria-hidden="true" />{' '}
              <span id="birthdayTableTitle">Konsumen Berulang Tahun Bulan Ini</span>
              <span className="card-heading-actions">
                <button type="button" className="btn-download" onClick={handleDownloadBirthdayCsv}>
                  <i className="fas fa-download" aria-hidden="true" /> Download CSV
                </button>
              </span>
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Tanggal Lahir</th>
                    <th>Usia ke-</th>
                    <th>No HP</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="birthdayTable">
                  {pagedBirthdays.map((c, i) => {
                    const status = getBirthdayStatus(c.birth);
                    const age = calculateAge(c.birth);
                    const waText = encodeURIComponent(`Halo Bapak/Ibu ${c.name}, Selamat Ulang Tahun yang ke-${age}! Dapatkan promo servis menarik dari AHASS kami.`);
                    return (
                      <tr key={i}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.birth}</td>
                        <td>{age} th</td>
                        <td>{c.phone}</td>
                        <td>
                          <span
                            className={`badge ${
                              status === 'today' ? 'success' : status === 'upcoming' ? 'warning' : 'info'
                            }`}
                          >
                            {status === 'today' ? 'Hari Ini' : status === 'upcoming' ? 'Mendatang' : 'Lewat'}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`https://wa.me/62${c.phone.replace(/^0/, '')}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-sm"
                            style={{
                              background: '#166534',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <i className="fab fa-whatsapp" /> Chat WA
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedBirthdays.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        Tidak ada konsumen berulang tahun pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-controls" id="birthdayTablePagination">
              <span className="page-info">
                {loading ? 'Memuat data...' : `Halaman ${bdayPage} dari ${totalBdayPages} (${birthdayList.length} data)`}
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
                <button
                  type="button"
                  className="page-btn active"
                >
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

          <div className="card">
            <h3>
              <i className="fas fa-chart-bar" aria-hidden="true" /> Penjualan per Bulan
            </h3>
            <div className="chart-container" style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '12px 4px' }}>
              {salesMonthly.map((item) => {
                const heightPct = Math.round((item.count / maxSales) * 100);
                return (
                  <div
                    key={item.month}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy)' }}>
                      {item.count}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '32px',
                        height: `${heightPct}%`,
                        backgroundColor: '#CC0000',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px' }}>
              <h3>
                <i className="fas fa-clock" aria-hidden="true" /> Event Terakhir
              </h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>HP</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody id="eventRecentTable">
                    {recentEvents.map((e, i) => (
                      <tr key={i}>
                        <td><strong>{e.name}</strong></td>
                        <td>{e.phone}</td>
                        <td>{e.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-list-ul" aria-hidden="true" /> Seluruh Data Event Masuk
            <span className="card-heading-actions">
              <button type="button" className="btn-download" onClick={handleDownloadEventCsv}>
                <i className="fas fa-download" aria-hidden="true" /> Download CSV
              </button>
            </span>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>No Mesin</th>
                  <th>Lokasi</th>
                  <th>Catatan</th>
                  <th>Tanggal Input</th>
                </tr>
              </thead>
              <tbody id="allEventTable">
                {pagedEvents.map((e, i) => (
                  <tr key={i}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.phone}</td>
                    <td><code>{e.engine}</code></td>
                    <td>{e.location || '-'}</td>
                    <td>{e.notes || '-'}</td>
                    <td>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls" id="allEventTablePagination">
            <span className="page-info">
              {loading ? 'Memuat data...' : `Halaman ${eventPage} dari ${totalEventPages} (${eventList.length} data)`}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="page-btn"
                disabled={eventPage <= 1}
                onClick={() => setEventPage((p) => Math.max(1, p - 1))}
              >
                &laquo;
              </button>
              <button
                type="button"
                className="page-btn active"
              >
                {eventPage}
              </button>
              <button
                type="button"
                className="page-btn"
                disabled={eventPage >= totalEventPages}
                onClick={() => setEventPage((p) => Math.min(totalEventPages, p + 1))}
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
