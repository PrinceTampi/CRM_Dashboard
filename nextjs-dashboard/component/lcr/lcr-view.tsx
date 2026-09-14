'use client';

import React, { useMemo, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadCsvFile, getToday, initialLcrData } from '@/lib/crm-data';
import type { LcrRecord } from '@/lib/definitions';

export function LcrView() {
  const [records, setRecords] = useState<LcrRecord[]>(initialLcrData);
  const [motor, setMotor] = useState('Semua');
  const [district, setDistrict] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', nik: '', motor: '', district: '', status: 'Prospek', contact: 'Belum di-FU', result: 'Belum ada hasil' });
  const filtered = useMemo(() => records.filter((row) => (motor === 'Semua' || row.motor === motor) && (district === 'Semua' || row.district === district) && (status === 'Semua' || row.status === status)), [records, motor, district, status]);
  const options = (key: 'motor' | 'district' | 'status') => ['Semua', ...Array.from(new Set(records.map((row) => row[key])))];
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addRecord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone) return;
    setRecords((current) => [{ ...form, date: getToday() }, ...current]);
    setForm({ name: '', phone: '', nik: '', motor: '', district: '', status: 'Prospek', contact: 'Belum di-FU', result: 'Belum ada hasil' });
    setShowForm(false);
  };
  const download = () => downloadCsvFile('Hasil_FU_LCR.csv', ['Nama', 'No HP', 'NIK', 'Tipe Motor', 'Kecamatan', 'Status', 'Kontak', 'Hasil FU', 'Tanggal'], filtered.map((row) => [row.name, row.phone, row.nik, row.motor, row.district, row.status, row.contact, row.result, row.date]));

  return <CrmShell title="LCR" crumb="Admin & Follow-up">
    <div className="tab-content" style={{ display: 'block' }}>
      <div className="page-heading"><h2>Monitoring dan Input FU LCR</h2><p>Input hasil follow-up LCR dan pantau seluruh hasil berdasarkan tipe motor, kecamatan, dan status.</p></div>
      <div className="filter-grid">
        {([['motor', 'Tipe Motor', motor, setMotor], ['district', 'Kecamatan', district, setDistrict], ['status', 'Status FU', status, setStatus]] as const).map(([key, label, value, setter]) => <div className="filter-field" key={key}><label htmlFor={`lcr-${key}`}>{label}</label><select id={`lcr-${key}`} value={value} onChange={(e) => setter(e.target.value)}>{options(key).map((option) => <option key={option}>{option}</option>)}</select></div>)}
        <div className="filter-field"><label>&nbsp;</label><button type="button" className="btn-sm primary" onClick={() => setShowForm((current) => !current)}><i className="fas fa-plus" aria-hidden="true" /> Input Hasil FU</button></div>
      </div>
      {showForm && <form className="card" onSubmit={addRecord}><h3>Input Hasil FU LCR</h3><div className="form-row-3">{(['name', 'phone', 'nik', 'motor', 'district'] as const).map((key) => <div className="form-group" key={key}><label htmlFor={`lcr-input-${key}`}>{key === 'name' ? 'Nama' : key === 'phone' ? 'No HP' : key.toUpperCase()}</label><input id={`lcr-input-${key}`} value={form[key]} onChange={(e) => update(key, e.target.value)} required={key === 'name' || key === 'phone'} /></div>)}<div className="form-group"><label htmlFor="lcr-input-status">Status</label><select id="lcr-input-status" value={form.status} onChange={(e) => update('status', e.target.value)}><option>Prospek</option><option>Booking</option><option>Sudah Service</option><option>Tidak Terhubung</option></select></div><div className="form-group"><label htmlFor="lcr-input-result">Hasil FU</label><input id="lcr-input-result" value={form.result} onChange={(e) => update('result', e.target.value)} /></div></div><button className="btn-submit" type="submit"><i className="fas fa-save" aria-hidden="true" /> Simpan Hasil FU</button></form>}
      <div className="stats-grid"><div className="stat-card stat-static"><div className="stat-icon blue"><i className="fas fa-users" /></div><div className="stat-info"><div className="number">{filtered.length}</div><div className="label">Semua FU Terfilter</div></div></div><div className="stat-card stat-static"><div className="stat-icon green"><i className="fas fa-phone" /></div><div className="stat-info"><div className="number">{filtered.filter((row) => row.contact === 'Terhubung').length}</div><div className="label">Terhubung</div></div></div><div className="stat-card stat-static"><div className="stat-icon orange"><i className="fas fa-calendar-check" /></div><div className="stat-info"><div className="number">{filtered.filter((row) => row.status === 'Sudah Service').length}</div><div className="label">Sudah Service</div></div></div></div>
      <div className="card"><h3><i className="fas fa-table" /> Detail FU LCR <button type="button" className="btn-download" onClick={download}><i className="fas fa-download" /> Download CSV</button></h3><div className="table-wrap"><table><thead><tr><th>Nama</th><th>No HP</th><th>NIK</th><th>Motor</th><th>Kecamatan</th><th>Status</th><th>Kontak</th><th>Hasil FU</th><th>Tanggal</th></tr></thead><tbody>{filtered.map((row) => <tr key={`${row.phone}-${row.date}`}><td><strong>{row.name}</strong></td><td>{row.phone}</td><td>{row.nik}</td><td>{row.motor}</td><td>{row.district}</td><td><span className="badge info">{row.status}</span></td><td>{row.contact}</td><td>{row.result}</td><td>{row.date}</td></tr>)}</tbody></table></div></div>
    </div>
  </CrmShell>;
}
