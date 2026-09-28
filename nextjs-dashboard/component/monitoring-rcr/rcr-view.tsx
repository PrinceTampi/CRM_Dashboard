'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

type RcrRecord = {
  period: string;
  dealer: string;
  segment: string;
  category: string;
  totalCustomer: number;
  repeatCustomer: number;
};

function monthLabelFromKey(monthKey: string) {
  if (!monthKey) return 'Periode';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
}

function sumRows(rows: RcrRecord[]) {
  return rows.reduce(
    (accumulator, row) => ({
      totalCustomer: accumulator.totalCustomer + row.totalCustomer,
      repeatCustomer: accumulator.repeatCustomer + row.repeatCustomer,
    }),
    { totalCustomer: 0, repeatCustomer: 0 },
  );
}

function calculateRcr(totalCustomer: number, repeatCustomer: number) {
  if (totalCustomer === 0) return 0;
  return (repeatCustomer / totalCustomer) * 100;
}

function FilterField({
  label,
  id,
  value,
  options,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MonitoringRcrView() {
  const [rcrRows, setRcrRows] = useState<RcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('Semua');
  const [selectedSegment, setSelectedSegment] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/rcr/summary', { cache: 'no-store' });
        const payload = await response.json();
        if (!active) return;

        const rows: RcrRecord[] = payload.rows ?? [];
        setRcrRows(rows);

        if (rows.length > 0) {
          const months = Array.from(new Set(rows.map((row) => row.period))).sort();
          setSelectedMonth((current) => current || months[months.length - 1] || '');
        }
      } catch (error) {
        console.error('Failed to load RCR summary', error);
        setRcrRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const monthOptions = useMemo(
    () => Array.from(new Set(rcrRows.map((row) => row.period))).sort(),
    [rcrRows],
  );

  const filters = useMemo(() => {
    const dealerOptions = ['Semua', ...new Set(rcrRows.map((row) => row.dealer))];
    const segmentOptions = ['Semua', ...new Set(rcrRows.map((row) => row.segment))];
    const categoryOptions = ['Semua', ...new Set(rcrRows.map((row) => row.category))];

    return {
      dealerOptions,
      segmentOptions,
      categoryOptions,
      monthOptions,
    };
  }, [rcrRows, monthOptions]);

  const monthKeyValue = selectedMonth || monthOptions[monthOptions.length - 1] || '';

  const filteredRows = useMemo(
    () =>
      rcrRows.filter((row) => {
        const monthMatch = row.period === monthKeyValue;
        const dealerMatch = selectedDealer === 'Semua' || row.dealer === selectedDealer;
        const segmentMatch = selectedSegment === 'Semua' || row.segment === selectedSegment;
        const categoryMatch = selectedCategory === 'Semua' || row.category === selectedCategory;
        return monthMatch && dealerMatch && segmentMatch && categoryMatch;
      }),
    [rcrRows, monthKeyValue, selectedDealer, selectedSegment, selectedCategory],
  );

  const currentTotals = sumRows(filteredRows);
  const currentRcr = calculateRcr(currentTotals.totalCustomer, currentTotals.repeatCustomer);

  const previousMonth = useMemo(() => {
    if (!monthOptions.length) return '';
    const currentIndex = monthOptions.indexOf(monthKeyValue);
    if (currentIndex <= 0) return monthOptions[0] || '';
    return monthOptions[currentIndex - 1] || '';
  }, [monthKeyValue, monthOptions]);

  const previousRows = useMemo(
    () =>
      rcrRows.filter((row) => {
        const monthMatch = row.period === previousMonth;
        const dealerMatch = selectedDealer === 'Semua' || row.dealer === selectedDealer;
        const segmentMatch = selectedSegment === 'Semua' || row.segment === selectedSegment;
        const categoryMatch = selectedCategory === 'Semua' || row.category === selectedCategory;
        return monthMatch && dealerMatch && segmentMatch && categoryMatch;
      }),
    [rcrRows, previousMonth, selectedDealer, selectedSegment, selectedCategory],
  );

  const previousTotals = sumRows(previousRows);
  const previousRcr = calculateRcr(previousTotals.totalCustomer, previousTotals.repeatCustomer);
  const growthValue = currentRcr - previousRcr;

  const trend = useMemo(() => {
    return monthOptions.map((monthKey) => {
      const monthRows = rcrRows.filter((row) => {
        const dealerMatch = selectedDealer === 'Semua' || row.dealer === selectedDealer;
        const segmentMatch = selectedSegment === 'Semua' || row.segment === selectedSegment;
        const categoryMatch = selectedCategory === 'Semua' || row.category === selectedCategory;
        return row.period === monthKey && dealerMatch && segmentMatch && categoryMatch;
      });

      const totals = sumRows(monthRows);
      return {
        month: monthLabelFromKey(monthKey),
        key: monthKey,
        value: calculateRcr(totals.totalCustomer, totals.repeatCustomer),
      };
    });
  }, [monthOptions, rcrRows, selectedDealer, selectedSegment, selectedCategory]);

  const statusText = growthValue > 0 ? 'Naik' : growthValue < 0 ? 'Turun' : 'Stabil';
  const comparisonText = `${statusText} ${Math.abs(growthValue).toFixed(1)} p.p.`;
  const currentLabel = monthLabelFromKey(monthKeyValue);
  const previousLabel = previousMonth ? monthLabelFromKey(previousMonth) : 'Tidak ada baseline';

  return (
    <CrmShell title="Monitoring RCR" crumb="Customer Performance">
      <div id="monitoringrcr" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Monitoring RCR</h2>
          <p>Monitoring performa repeat customer berdasarkan jumlah pelanggan yang datang kembali dalam periode tertentu.</p>
        </div>

        <div className="kpi-hint">
          <i className="fas fa-circle-info" aria-hidden="true" /> RCR dihitung dari customer yang repeat dibagi total customer pada periode yang dipilih. Definisi repeat customer mengikuti pola transaksi yang terdeteksi pada data Excel yang tersedia.
        </div>

        <div className="filter-grid">
          <FilterField
            id="rcrMonth"
            label="Month"
            value={currentLabel}
            options={monthOptions.map((monthKey) => monthLabelFromKey(monthKey))}
            onChange={(value) => {
              const monthKey = monthOptions.find((entry) => monthLabelFromKey(entry) === value) ?? value;
              setSelectedMonth(monthKey);
            }}
          />
          <FilterField
            id="rcrDealer"
            label="Dealer / AHASS"
            value={selectedDealer}
            options={filters.dealerOptions}
            onChange={setSelectedDealer}
          />
          <FilterField
            id="rcrSegment"
            label="Customer Segment"
            value={selectedSegment}
            options={filters.segmentOptions}
            onChange={setSelectedSegment}
          />
          <FilterField
            id="rcrCategory"
            label="Service Category"
            value={selectedCategory}
            options={filters.categoryOptions}
            onChange={setSelectedCategory}
          />
        </div>

        {loading ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Memuat data RCR dari sumber Excel/CSV...
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-static stat-primary">
                <div className="stat-icon red">
                  <i className="fas fa-percent" aria-hidden="true" />
                </div>
                <div className="stat-info">
                  <div className="number">{formatPercent(currentRcr)}</div>
                  <div className="label">RCR</div>
                  <div className="empty-kpi-sub">{currentLabel}</div>
                </div>
              </div>

              <div className="stat-card stat-static">
                <div className="stat-icon blue">
                  <i className="fas fa-users" aria-hidden="true" />
                </div>
                <div className="stat-info">
                  <div className="number">{formatNumber(currentTotals.totalCustomer)}</div>
                  <div className="label">Total Customer</div>
                  <div className="empty-kpi-sub">{currentLabel}</div>
                </div>
              </div>

              <div className="stat-card stat-static">
                <div className="stat-icon green">
                  <i className="fas fa-user-check" aria-hidden="true" />
                </div>
                <div className="stat-info">
                  <div className="number">{formatNumber(currentTotals.repeatCustomer)}</div>
                  <div className="label">Repeat Customer</div>
                  <div className="empty-kpi-sub">{currentLabel}</div>
                </div>
              </div>

              <div className="stat-card stat-static">
                <div className="stat-icon orange">
                  <i className="fas fa-arrow-trend-up" aria-hidden="true" />
                </div>
                <div className="stat-info">
                  <div className="number">{growthValue >= 0 ? '+' : ''}{formatPercent(growthValue)}</div>
                  <div className="label">Growth / Comparison</div>
                  <div className="empty-kpi-sub">vs {previousLabel}</div>
                </div>
              </div>
            </div>

            <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Period</div>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>{formatPercent(currentRcr)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→ {comparisonText}</div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Previous Period</div>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>{formatPercent(previousRcr)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{previousLabel}</div>
              </div>
            </div>

            <div className="card">
              <h3>Tren RCR</h3>
              <div style={{ display: 'flex', alignItems: 'end', gap: '12px', minHeight: '180px', paddingTop: '16px' }}>
                {trend.map((point) => (
                  <div key={point.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'end', height: '120px' }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: `${Math.max(point.value * 2.2, 18)}px`,
                          background: point.key === monthKeyValue ? '#CC0000' : '#D1D5DB',
                          borderRadius: '8px 8px 0 0',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          color: '#111827',
                          fontSize: '11px',
                          fontWeight: 700,
                          paddingTop: '6px',
                        }}
                      >
                        {point.value.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{point.month.split(' ')[0]}</div>
                  </div>
                ))}
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
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Tidak ada data</div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                              Filter yang dipilih belum memiliki data RCR untuk periode ini.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const rowRcr = calculateRcr(row.totalCustomer, row.repeatCustomer);
                        return (
                          <tr key={`${row.period}-${row.dealer}-${row.segment}-${row.category}`}>
                            <td>{monthLabelFromKey(row.period)}</td>
                            <td>{row.dealer}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(row.totalCustomer)}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(row.repeatCustomer)}</td>
                            <td style={{ textAlign: 'right' }}>{formatPercent(rowRcr)}</td>
                            <td>
                              <span className="badge info">
                                {rowRcr >= currentRcr ? 'Healthy' : 'Watch'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </CrmShell>
  );
}
