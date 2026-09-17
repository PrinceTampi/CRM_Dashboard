import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLcrHeaderMap, normalizeLcrRow } from './lcr.ts';

test('buildLcrHeaderMap maps LCR fields to canonical names', () => {
  const map = buildLcrHeaderMap([
    'Nomor Mesin',
    'Nomor Rangka',
    'Kode Dealer',
    'Nama Dealer 2',
    'Area Ring',
    'Sudah dilakukan Pengerjaan',
  ]);

  assert.equal(map['nomor mesin'], 'nomor_mesin');
  assert.equal(map['nomor rangka'], 'nomor_rangka');
  assert.equal(map['kode dealer'], 'kode_dealer');
  assert.equal(map['nama dealer 2'], 'nama_dealer_2');
  assert.equal(map['area ring'], 'area_ring');
});

test('normalizeLcrRow retains engine and treatment fields for LCR matching', () => {
  const row = normalizeLcrRow({
    'Nomor Mesin': ' MH1A  1234567 ',
    'Nomor Rangka': ' MHB 7654321 ',
    'Kode Dealer': 'MJS',
    'Nama Dealer 2': 'MJS Manado',
    'Area Ring': 'SULUT',
    'Sudah dilakukan Pengerjaan': 'Sudah LCR',
  });

  assert.equal(row.engineNumber, 'MH1A1234567');
  assert.equal(row.frameNumber, 'MHB7654321');
  assert.equal(row.dealerCode, 'MJS');
  assert.equal(row.operatingDealer, 'MJS Manado');
  assert.equal(row.ring, 'SULUT');
  assert.equal(row.isTreated, true);
  assert.equal(row.treatmentStatus, 'Sudah LCR');
});
