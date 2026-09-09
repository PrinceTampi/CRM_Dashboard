'use client';

import React, { useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { initialEventData, getToday } from '@/lib/crm-data';
import type { EventRecord } from '@/lib/definitions';

export function CustomersPage() {
  const [events, setEvents] = useState<EventRecord[]>(initialEventData);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [engine, setEngine] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !engine.trim()) {
      setAlertMsg({ type: 'error', text: 'Nama, Nomor HP, dan Nomor Mesin wajib diisi.' });
      return;
    }

    const newRecord: EventRecord = {
      name: name.trim().toUpperCase(),
      phone: phone.trim(),
      engine: engine.trim().toUpperCase(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      date: getToday(),
    };

    setEvents([newRecord, ...events]);
    setName('');
    setPhone('');
    setEngine('');
    setLocation('');
    setNotes('');
    setAlertMsg({
      type: 'success',
      text: `Data konsumen ${newRecord.name} berhasil disimpan ke registrasi event AHASS.`,
    });

    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setEngine('');
    setLocation('');
    setNotes('');
    setAlertMsg(null);
  };

  return (
    <CrmShell title="Input AHASS" crumb="Customer & AHASS">
      <div id="input" className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Input AHASS</h2>
          <p>Isi data konsumen yang ditemui saat servis atau kegiatan di luar dealer.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
          <div className="card" style={{ maxWidth: '720px' }}>
            <form id="eventForm" onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>Informasi Konsumen</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="inputName">
                      Nama Lengkap <span className="required" style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="inputName"
                      placeholder="Contoh: Anwar Bolonggodu"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="inputPhone">
                      No HP <span className="required" style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="inputPhone"
                      placeholder="0812xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Informasi Kendaraan</h4>
                <div className="form-group">
                  <label htmlFor="inputEngine">
                    Nomor Mesin <span className="required" style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="inputEngine"
                    placeholder="Contoh: JFD2E 2447800"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Informasi Event</h4>
                <div className="form-group">
                  <label htmlFor="inputLocation">Lokasi Event / AHASS</label>
                  <input
                    type="text"
                    id="inputLocation"
                    placeholder="Misal: Pasar Minggu / AHASS Kombos"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Catatan Tambahan</h4>
                <div className="form-group">
                  <label htmlFor="inputNotes">Catatan</label>
                  <input
                    type="text"
                    id="inputNotes"
                    placeholder="Minat motor sport / kredit / jadwal servis"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn-submit" style={{ background: '#0B1E33', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-save" aria-hidden="true" /> Simpan Data Konsumen
                </button>
                <button
                  type="button"
                  className="btn-reset"
                  onClick={handleReset}
                  style={{ background: '#E5E7EB', color: 'var(--text)', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Reset
                </button>
              </div>
            </form>

            {alertMsg && (
              <div
                className={`alert ${alertMsg.type}`}
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  background: alertMsg.type === 'success' ? '#ECFDF3' : '#FEF2F2',
                  color: alertMsg.type === 'success' ? '#166534' : '#991B1B',
                  fontSize: '13px',
                }}
              >
                <i className={`fas ${alertMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />{' '}
                {alertMsg.text}
              </div>
            )}
          </div>

          <div className="card">
            <h3>
              <i className="fas fa-history" aria-hidden="true" /> Konsumen Baru Disimpan ({events.length})
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>HP</th>
                    <th>No Mesin</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 8).map((ev, i) => (
                    <tr key={i}>
                      <td><strong>{ev.name}</strong></td>
                      <td>{ev.phone}</td>
                      <td><code>{ev.engine}</code></td>
                      <td>{ev.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
