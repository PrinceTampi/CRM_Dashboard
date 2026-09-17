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
    'Dealer',
    'Status',
  ]);

  assert.equal(map['id leads'], 'lead_id');
  assert.equal(map['id guestbook'], 'guestbook_id');
  assert.equal(map['nama prospek'], 'customer_name');
  assert.equal(map['no. hp prospek'], 'phone');
  assert.equal(map['channel penjualan'], 'sales_channel');
  assert.equal(map['dealer'], 'assigned_dealer');
  assert.equal(map['status'], 'status');
});

test('normalizeProspectRow preserves lead identity and assignment details', () => {
  const row = normalizeProspectRow({
    'ID Leads': 'PL-1001',
    'ID Guestbook': 'GB-77',
    'Tgl Input Guestbook': '2026-09-10',
    'Channel Penjualan': 'WhatsApp',
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
  assert.equal(row.prospectType, 'Hot Prospect');
  assert.equal(row.customerType, 'Baru');
  assert.equal(row.assignedDealerCode, 'MJS-01');
  assert.equal(row.status, 'CONTACTED');
});
