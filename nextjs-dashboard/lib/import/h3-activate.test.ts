import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildH3ActivationHeaderMap,
  compareH3IdentityToH23,
  normalizeH3ActivationRow,
} from './h3-activate.ts';

test('buildH3ActivationHeaderMap maps activation fields to canonical names', () => {
  const map = buildH3ActivationHeaderMap([
    'ID',
    'ID (JANGAN DIRUBAH/MODIFY/DIGESER)',
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
  assert.equal(map['id (jangan dirubah/modify/digeser)'], 'source_id');
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

test('normalizeH3ActivationRow reads workbook IDs, uses fallback phone, and preserves WITA upload time', () => {
  const row = normalizeH3ActivationRow({
    'ID (JANGAN DIRUBAH/MODIFY/DIGESER)': 15012,
    'Waktu Upload': '2026-10-04 19:01:46',
    Nama: 'Budi Santoso',
    'No HP': '',
    'No Telp': '+62 812-3456-7890',
  });

  assert.equal(row.sourceId, 15012);
  assert.equal(row.uploadedAt?.toISOString(), '2026-10-04T11:01:46.000Z');
  assert.equal(row.noHp, '081234567890');
});

test('compareH3IdentityToH23 matches normalized phone and name independently', () => {
  const result = compareH3IdentityToH23('  BUDI   SANTOSO ', '+62 812-3456-7890', [
    { name: 'Budi Santoso', normalizedName: 'budi santoso', phone: '081234567890' },
  ]);

  assert.deepEqual(result, { status: 'both', matchedByPhone: true, matchedByName: true });
});

test('compareH3IdentityToH23 flags name and phone matches on different H23 customers', () => {
  const result = compareH3IdentityToH23('Budi Santoso', '081234567890', [
    { name: 'Budi Santoso', normalizedName: 'budi santoso', phone: '081111111111' },
    { name: 'Andi Saputra', normalizedName: 'andi saputra', phone: '081234567890' },
  ]);

  assert.deepEqual(result, { status: 'conflict', matchedByPhone: true, matchedByName: true });
});
