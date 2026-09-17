'use client';

import React, { useEffect, useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';
import { getClientErrorMessage, isValidEngineNumber, isValidPhone, safeFetchJson } from '@/lib/client-safe';

type EventRecord = {
  id: string;
  name: string;
  phone: string;
  engineNumber: string;
  location: string | null;
  notes: string | null;
  eventDate: string;
};

function AlertBox({ alert }: { alert: { type: 'success' | 'error'; text: string } | null }) {
  if (!alert) return null;

  return (
    <div
      className={`alert ${alert.type}`}
      style={{
        marginTop: '16px',
        padding: '12px 14px',
        borderRadius: '6px',
        background: alert.type === 'success' ? '#ECFDF3' : '#FEF2F2',
        color: alert.type === 'success' ? '#166534' : '#991B1B',
        fontSize: '13px',
      }}
    >
      <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />{' '}
      {alert.text}
    </div>
  );
}

function CustomerTable({ events }: { events: EventRecord[] }) {
  return (
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
          {events.slice(0, 8).map((ev, index) => (
            <tr key={`${ev.id ?? ev.phone}-${index}`}>
              <td><strong>{ev.name}</strong></td>
              <td>{ev.phone}</td>
              <td><code>{ev.engineNumber}</code></td>
              <td>{ev.eventDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CustomersPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [engine, setEngine] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      const { data, error } = await safeFetchJson<{ events: EventRecord[] }>(
        '/api/events',
        { cache: 'no-store' },
        { events: [] }
      );

      if (!active) return;
      if (error) {
        setEvents([]);
        return;
      }

      setEvents(data?.events ?? []);
    };

    loadEvents();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEngine = engine.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEngine) {
      setAlertMsg({ type: 'error', text: 'Nama, Nomor HP, dan Nomor Mesin wajib diisi.' });
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setAlertMsg({ type: 'error', text: 'Nomor HP tidak valid. Gunakan format yang benar (min. 9 digit).' });
      return;
    }

    if (!isValidEngineNumber(trimmedEngine)) {
      setAlertMsg({ type: 'error', text: 'Nomor mesin terlalu pendek atau tidak valid.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await safeFetchJson<{ ok: boolean; event: EventRecord; message?: string }>(
        '/api/events',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            phone: trimmedPhone,
            engine: trimmedEngine,
            location: location.trim(),
            notes: notes.trim(),
          }),
        }
      );

      if (error || !data?.ok || !data.event) {
        throw new Error(error || data?.message || 'Gagal menyimpan data event.');
      }

      setEvents((current) => [data.event, ...current]);
      setName('');
      setPhone('');
      setEngine('');
      setLocation('');
      setNotes('');
      setAlertMsg({
        type: 'success',
        text: `Data konsumen ${data.event.name} berhasil disimpan ke registrasi event AHASS.`,
      });
    } catch (error) {
      setAlertMsg({
        type: 'error',
        text: getClientErrorMessage(error, 'Gagal menyimpan data event AHASS.'),
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
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
                <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ background: '#0B1E33', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-save" aria-hidden="true" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Data Konsumen'}
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

            <AlertBox alert={alertMsg} />
          </div>

          <div className="card">
            <h3>
              <i className="fas fa-history" aria-hidden="true" /> Konsumen Baru Disimpan ({events.length})
            </h3>
            <CustomerTable events={events} />
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
