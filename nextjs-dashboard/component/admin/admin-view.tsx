'use client';

import React, { useState } from 'react';
import { CrmShell } from '@/component/layout/crm-shell';

type FieldConfig = { key: string; label: string; module: string; type: 'text' | 'select' | 'number'; required: boolean };

const initialFields: FieldConfig[] = [
  { key: 'customerName', label: 'Nama Customer', module: 'Semua input', type: 'text', required: true },
  { key: 'phone', label: 'Nomor HP', module: 'H1 / H2 / H3', type: 'text', required: true },
  { key: 'nik', label: 'NIK', module: 'RO / LCR', type: 'text', required: false },
  { key: 'motorType', label: 'Tipe Motor', module: 'LCR / Niguri', type: 'select', required: false },
  { key: 'district', label: 'Kecamatan', module: 'LCR', type: 'select', required: false },
  { key: 'followUpStatus', label: 'Status FU', module: 'H2 / H3 / LCR', type: 'select', required: true },
];

export function AdminView() {
  const [fields, setFields] = useState(initialFields);
  const [notice, setNotice] = useState('');

  const updateField = (key: string, patch: Partial<FieldConfig>) => {
    setFields((current) => current.map((field) => field.key === key ? { ...field, ...patch } : field));
  };

  return (
    <CrmShell title="Admin Field" crumb="Admin & Follow-up">
      <div className="tab-content" style={{ display: 'block' }}>
        <div className="page-heading">
          <h2>Admin Field</h2>
          <p>Atur field yang tampil dan wajib diisi pada modul input CRM.</p>
        </div>
        <div className="kpi-hint"><i className="fas fa-shield-halved" aria-hidden="true" /> Konfigurasi ini tersimpan sebagai preferensi tampilan lokal. Data operasional tidak diubah.</div>
        <div className="card">
          <h3><i className="fas fa-sliders" aria-hidden="true" /> Konfigurasi Field Input</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Aktif</th><th>Nama Field</th><th>Modul</th><th>Tipe</th><th>Wajib</th></tr></thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.key}>
                    <td><input type="checkbox" defaultChecked aria-label={`Aktifkan ${field.label}`} /></td>
                    <td><input value={field.label} onChange={(e) => updateField(field.key, { label: e.target.value })} /></td>
                    <td>{field.module}</td>
                    <td>
                      <select value={field.type} onChange={(e) => updateField(field.key, { type: e.target.value as FieldConfig['type'] })}>
                        <option value="text">Teks</option><option value="select">Pilihan</option><option value="number">Angka</option>
                      </select>
                    </td>
                    <td><input type="checkbox" checked={field.required} onChange={(e) => updateField(field.key, { required: e.target.checked })} aria-label={`Wajibkan ${field.label}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-submit" onClick={() => setNotice('Konfigurasi field berhasil diterapkan pada sesi ini.')}><i className="fas fa-save" aria-hidden="true" /> Simpan Konfigurasi</button>
            <button type="button" className="btn-reset" onClick={() => setFields(initialFields)}>Reset</button>
          </div>
          {notice && <div className="alert success">{notice}</div>}
        </div>
      </div>
    </CrmShell>
  );
}
