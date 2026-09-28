import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProspectHeaderMap, normalizeProspectRow } from './prospect.ts';

test('buildProspectHeaderMap maps prospect fields to canonical names', () => {
  const map = buildProspectHeaderMap([
    'ID Leads',
    'ID Guestbook',
    'Nama Prospek',
    'No. HP Prospek',
    'Channel Penjualan',
    'Kode Event',
    'Deskripsi Event',
    'Platform Data',
    'Contact Status',
    'Media Contact FU',
    'Next Follow Up',
    'Batas SLA',
    'Dealer',
    'Status',
  ]);

  assert.equal(map['id leads'], 'lead_id');
  assert.equal(map['id guestbook'], 'guestbook_id');
  assert.equal(map['nama prospek'], 'customer_name');
  assert.equal(map['no. hp prospek'], 'phone');
  assert.equal(map['channel penjualan'], 'sales_channel');
  assert.equal(map['kode event'], 'event_code');
  assert.equal(map['deskripsi event'], 'event_description');
  assert.equal(map['platform data'], 'platform');
  assert.equal(map['contact status'], 'contact_status');
  assert.equal(map['media contact fu'], 'contact_channel');
  assert.equal(map['next follow up'], 'next_follow_up');
  assert.equal(map['batas sla'], 'sla_deadline');
  assert.equal(map['dealer'], 'assigned_dealer');
  assert.equal(map['status'], 'status');
});

test('normalizeProspectRow preserves lead identity and assignment details', () => {
  const row = normalizeProspectRow({
    'ID Leads': 'PL-1001',
    'ID Guestbook': 'GB-77',
    'Tgl Input Guestbook': '2026-09-10',
    'Channel Penjualan': 'WhatsApp',
    'Kode Event': 'EV-2026-04',
    'Deskripsi Event': 'Roadshow Dealer',
    'Platform Data': 'H1',
    'Contact Status': 'Contacted',
    'Media Contact FU': 'WhatsApp',
    'Next Follow Up': '2026-09-12',
    'Batas SLA': '2026-09-15',
    'Nama Prospek': 'Rina Dewi',
    'No. HP Prospek': '081234567890',
    'Tipe Prospek': 'Hot Prospect',
    'Tipe Customer': 'Baru',
    'Dealer': 'MJS-01',
    Status: 'CONTACTED',
  });

  assert.equal(row.leadId, 'PL-1001');
  assert.equal(row.guestbookId, 'GB-77');
  assert.equal(row.customerName, 'Rina Dewi');
  assert.equal(row.phone, '081234567890');
  assert.equal(row.salesChannel, 'WhatsApp');
  assert.equal(row.eventCode, 'EV-2026-04');
  assert.equal(row.eventDescription, 'Roadshow Dealer');
  assert.equal(row.platform, 'H1');
  assert.equal(row.contactStatus, 'Contacted');
  assert.equal(row.contactChannel, 'WhatsApp');
  assert.equal(row.nextFollowUp?.toISOString().slice(0, 10), '2026-09-12');
  assert.equal(row.slaDeadline?.toISOString().slice(0, 10), '2026-09-15');
  assert.equal(row.prospectType, 'Hot Prospect');
  assert.equal(row.customerType, 'Baru');
  assert.equal(row.assignedDealerCode, 'MJS-01');
  assert.equal(row.status, 'CONTACTED');
});

test('normalizeProspectRow accepts canonicalized headers from the workbook header map', () => {
  const row = normalizeProspectRow({
    lead_id: 'PL-2001',
    guestbook_id: 'GB-88',
    guestbook_at: '2026-09-18',
    phone: '081234567890',
    customer_name: 'Sari Putri',
    assigned_dealer: 'MJS-01',
    contact_status: 'Contacted',
  });

  assert.equal(row.leadId, 'PL-2001');
  assert.equal(row.guestbookId, 'GB-88');
  assert.equal(row.phone, '081234567890');
  assert.equal(row.customerName, 'Sari Putri');
  assert.equal(row.assignedDealerCode, 'MJS-01');
  assert.equal(row.contactStatus, 'Contacted');
});
