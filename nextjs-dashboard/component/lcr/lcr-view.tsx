'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile } from '@/lib/crm-data';

type LcrRecord = {
  id: string;
  name: string;
  phone: string;
  nik: string;
  motor: string;
  district: string;
  status: string;
  contact: string;
  result: string;
  date: string;
};

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
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function LcrStatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone: 'blue' | 'green' | 'orange';
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

export function LcrView() {
  const [records, setRecords] = useState<LcrRecord[]>([]);
  const [motor, setMotor] = useState('Semua');
  const [district, setDistrict] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', nik: '', motor: '', district: '', status: 'Prospek', contact: 'Belum di-FU', result: 'Belum ada hasil' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/lcr', { cache: 'no-store' });
        const payload = await response.json();
        if (!active) return;
        setRecords(payload.records ?? []);
      } catch {
        if (active) setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => records.filter((row) => (motor === 'Semua' || row.motor === motor) && (district === 'Semua' || row.district === district) && (status === 'Semua' || row.status === status)), [records, motor, district, status]);
  const options = (key: 'motor' | 'district' | 'status') => ['Semua', ...Array.from(new Set(records.map((row) => row[key])))];
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/lcr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          nik: form.nik,
          motor: form.motor,
          district: form.district,
          status: form.status,
          contact: form.contact,
          result: form.result,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || 'Gagal menyimpan data LCR.');
      }

      setRecords((current) => [payload.record, ...current]);
      setForm({ name: '', phone: '', nik: '', motor: '', district: '', status: 'Prospek', contact: 'Belum di-FU', result: 'Belum ada hasil' });
      setShowForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const download = () => downloadCsvFile('Hasil_FU_LCR.csv', ['Nama', 'No HP', 'NIK', 'Tipe Motor', 'Kecamatan', 'Status', 'Kontak', 'Hasil FU', 'Tanggal'], filtered.map((row) => [row.name, row.phone, row.nik, row.motor, row.district, row.status, row.contact, row.result, row.date]));

  return (
    <CrmShell title="LCR" crumb="Admin & Follow-up">
      <div className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Monitoring dan Input FU LCR</h2>
          <p>Input hasil follow-up LCR dan pantau seluruh hasil berdasarkan tipe motor, kecamatan, dan status.</p>
        </div>

        <div className="filter-grid">
          {([
            ['motor', 'Tipe Motor', motor],
            ['district', 'Kecamatan', district],
            ['status', 'Status FU', status],
          ] as const).map(([key, label, value]) => (
            <FilterField
              key={key}
              id={`lcr-${key}`}
              label={label}
              value={value}
              options={options(key)}
              onChange={(next) => {
                if (key === 'motor') setMotor(next);
                if (key === 'district') setDistrict(next);
                if (key === 'status') setStatus(next);
              }}
            />
          ))}

          <div className="filter-field">
            <label>&nbsp;</label>
            <button type="button" className="btn-sm primary" onClick={() => setShowForm((current) => !current)}>
              <i className="fas fa-plus" aria-hidden="true" /> Input Hasil FU
            </button>
          </div>
        </div>

        {showForm && (
          <form className="card" onSubmit={addRecord}>
            <h3>Input Hasil FU LCR</h3>
            <div className="form-row-3">
              {(['name', 'phone', 'nik', 'motor', 'district'] as const).map((key) => (
                <div className="form-group" key={key}>
                  <label htmlFor={`lcr-input-${key}`}>
                    {key === 'name' ? 'Nama' : key === 'phone' ? 'No HP' : key.toUpperCase()}
                  </label>
                  <input
                    id={`lcr-input-${key}`}
                    value={form[key]}
                    onChange={(event) => update(key, event.target.value)}
                    required={key === 'name' || key === 'phone'}
                  />
                </div>
              ))}

              <div className="form-group">
                <label htmlFor="lcr-input-status">Status</label>
                <select id="lcr-input-status" value={form.status} onChange={(event) => update('status', event.target.value)}>
                  <option>Prospek</option>
                  <option>Booking</option>
                  <option>Sudah Service</option>
                  <option>Tidak Terhubung</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="lcr-input-result">Hasil FU</label>
                <input id="lcr-input-result" value={form.result} onChange={(event) => update('result', event.target.value)} />
              </div>
            </div>

            <button className="btn-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil FU'}
            </button>
          </form>
        )}

        <div className="stats-grid">
          <LcrStatCard icon="fa-users" value={filtered.length} label="Semua FU Terfilter" tone="blue" />
          <LcrStatCard icon="fa-phone" value={filtered.filter((row) => row.contact === 'Terhubung').length} label="Terhubung" tone="green" />
          <LcrStatCard icon="fa-calendar-check" value={filtered.filter((row) => row.status === 'Sudah Service').length} label="Sudah Service" tone="orange" />
        </div>

        <div className="card">
          <h3>
            <i className="fas fa-table" aria-hidden="true" /> Detail FU LCR
            <button type="button" className="btn-download" onClick={download}>
              <i className="fas fa-download" aria-hidden="true" /> Download CSV
            </button>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No HP</th>
                  <th>NIK</th>
                  <th>Motor</th>
                  <th>Kecamatan</th>
                  <th>Status</th>
                  <th>Kontak</th>
                  <th>Hasil FU</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '18px' }}>Belum ada data LCR untuk filter ini.</td>
                  </tr>
                ) : filtered.map((row) => (
                  <tr key={`${row.phone}-${row.date}`}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.phone}</td>
                    <td>{row.nik}</td>
                    <td>{row.motor}</td>
                    <td>{row.district}</td>
                    <td><span className="badge info">{row.status}</span></td>
                    <td>{row.contact}</td>
                    <td>{row.result}</td>
                    <td>{row.date}</td>
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
