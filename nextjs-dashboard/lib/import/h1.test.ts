import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeH1Row, buildH1HeaderMap } from './h1.ts';

test('buildH1HeaderMap maps Indonesian header names to canonical fields', () => {
  const map = buildH1HeaderMap(['No', 'Kode Dealer', 'Tanggal Faktur', 'Nama Konsumen', 'No KTP', 'No HP', 'Nomor Mesin', 'Nomor Rangka']);

  assert.equal(map['no'], 'no');
  assert.equal(map['kode dealer'], 'kode_dealer');
  assert.equal(map['tanggal faktur'], 'tanggal_faktur');
  assert.equal(map['no ktp'], 'no_ktp');
  assert.equal(map['nomor mesin'], 'nomor_mesin');
});

test('normalizeH1Row strips formatting and normalizes critical fields', () => {
  const row = normalizeH1Row({
    no: '1',
    kode_dealer: 'MJS',
    tanggal_faktur: '08-09-2026',
    nama_konsumen: '  Test User  ',
    no_ktp: '3201010101010001',
    tanggal_lahir: '18-09-1990',
    no_hp: '+62 812-3456-7890',
    nomor_mesin: ' MH1A  1234567 ',
    nomor_rangka: ' MHB 7654321 ',
    jenis_bayar: 'CASH',
  });

  assert.equal(row.no, 1);
  assert.equal(row.kode_dealer, 'MJS');
  assert.equal(row.no_ktp, '3201010101010001');
  assert.equal(row.no_hp, '081234567890');
  assert.equal(row.nomor_mesin, 'MH1A1234567');
  assert.equal(row.nomor_rangka, 'MHB7654321');
  assert.equal(row.tanggal_faktur instanceof Date, true);
  assert.equal(row.tanggal_lahir instanceof Date, true);
});
