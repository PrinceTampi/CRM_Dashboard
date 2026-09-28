import test from 'node:test';
import assert from 'node:assert/strict';

import { buildH3ActivationHeaderMap, normalizeH3ActivationRow } from './h3-activate.ts';

test('buildH3ActivationHeaderMap maps activation fields to canonical names', () => {
  const map = buildH3ActivationHeaderMap([
    'ID',
    'Waktu Upload',
    'Nama',
    'No HP',
    'MD',
    'Assigned Dealer',
    'Source Data',
    'Identify Has FU',
    'Lebel Contact',
    'Progress FU',
    'Prospect Status',
    'Waktu Follow Up',
  ]);

  assert.equal(map['id'], 'source_id');
  assert.equal(map['waktu upload'], 'uploaded_at');
  assert.equal(map['nama'], 'nama');
  assert.equal(map['no hp'], 'no_hp');
  assert.equal(map['md'], 'md_code');
  assert.equal(map['assigned dealer'], 'assigned_dealer');
  assert.equal(map['source data'], 'source_data');
  assert.equal(map['identify has fu'], 'has_follow_up');
  assert.equal(map['lebel contact'], 'contact_label');
  assert.equal(map['progress fu'], 'progress_status');
  assert.equal(map['prospect status'], 'prospect_status');
  assert.equal(map['waktu follow up'], 'followed_up_at');
});

test('normalizeH3ActivationRow preserves lead identity and FU status', () => {
  const row = normalizeH3ActivationRow({
    ID: 15012,
    'Waktu Upload': '2026-09-15 09:15:00',
    Nama: 'Budi Santoso',
    'No HP': '081234567890',
    MD: 'HC3-MD',
    'Assigned Dealer': 'MJS-202',
    'Source Data': 'H1 to H3',
    'Identify Has FU': 'YA',
    'Status Contact': 'Telp Terhubung',
    'Lebel Contact': 'CONTACTED',
    'Progress FU': 'Deal',
    'Prospect Status': 'Prospect Hot',
    'Waktu Follow Up': '2026-09-16 10:00:00',
    'Alasan Not Deal': 'Sudah Membeli',
  });

  assert.equal(row.sourceId, 15012);
  assert.equal(row.uploadedAt instanceof Date, true);
  assert.equal(row.customerName, 'Budi Santoso');
  assert.equal(row.noHp, '081234567890');
  assert.equal(row.mdCode, 'HC3-MD');
  assert.equal(row.assignedDealerCode, 'MJS-202');
  assert.equal(row.sourceData, 'H1 to H3');
  assert.equal(row.hasFollowUp, 'YA');
  assert.equal(row.contactStatus, 'Telp Terhubung');
  assert.equal(row.contactLabel, 'CONTACTED');
  assert.equal(row.progressStatus, 'Deal');
  assert.equal(row.prospectStatus, 'Prospect Hot');
  assert.equal(row.followedUpAt instanceof Date, true);
  assert.equal(row.notDealReason, 'Sudah Membeli');
});
