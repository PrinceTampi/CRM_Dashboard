import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeH23Row, buildH23HeaderMap, validateH23ImportType, validateH23RowContract } from './h23.ts';

test('buildH23HeaderMap maps invoice, item, and transaction headers to canonical fields', () => {
  const map = buildH23HeaderMap([
    'Inv No',
    'Tgl Invoice',
    'Cust Name',
    'Ref No',
    'Item No',
    'Qty',
    'Price',
    'Gross Amt',
    'Disc Rate',
    'Jenis Transaksi',
    'Nosin',
    'Noka',
  ]);

  assert.equal(map['inv no'], 'inv_no');
  assert.equal(map['tgl invoice'], 'tgl_invoice');
  assert.equal(map['item no'], 'item_no');
  assert.equal(map['disc rate'], 'disc_rate');
  assert.equal(map['jenis transaksi'], 'jenis_transaksi');
  assert.equal(map['noka'], 'noka');
});

test('normalizeH23Row normalizes invoice, item, and transaction fields', () => {
  const row = normalizeH23Row({
    'Inv No': 'INV-001',
    'Tgl Invoice': '08-09-2026',
    'Cust Name': 'Rina',
    'Ref No': 'WO-77',
    'Item No': 'A-100',
    'Item Desc': 'Service Unit',
    'Qty': '2',
    'Price': '250000',
    'Gross Amt': '500000',
    'Disc Rate': '0.25',
    'Disc Amt': '125000',
    'Jenis Transaksi': 'PARTSERVICE',
    'Dealer Name': 'MJS',
    'No Hp': '+62 812-3456-7890',
    'Nosin': ' MH1A  1234567 ',
    'Noka': ' MHB 7654321 ',
    'Group Part': 'SUSPENSI',
  });

  assert.equal(row.invoiceNumber, 'INV-001');
  assert.equal(row.workOrderNumber, 'WO-77');
  assert.equal(row.customerName, 'Rina');
  assert.equal(row.quantity, 2);
  assert.equal(row.price, 250000);
  assert.equal(row.grossAmount, 500000);
  assert.equal(row.discountRate, 0.25);
  assert.equal(row.transactionType, 'PARTSERVICE');
  assert.equal(row.noHp, '081234567890');
  assert.equal(row.engineNumber, 'MH1A1234567');
  assert.equal(row.frameNumber, 'MHB7654321');
  assert.equal(row.groupPart, 'SUSPENSI');
});

test('normalizeH23Row canonicalizes group-part aliases to the domain vocabulary', () => {
  const row = normalizeH23Row({
    'Inv No': 'INV-002',
    'Tgl Invoice': '09-09-2026',
    'Item No': 'C-100',
    'Item Desc': 'Ganti Oli',
    'Qty': '1',
    'Price': '150000',
    'Gross Amt': '150000',
    'Jenis Transaksi': 'PART',
    'Dealer Name': 'MJS',
    'Group Part': ' oli ',
  });

  assert.equal(row.groupPart, 'OLI');
});

test('validateH23ImportType enforces H2 SERVICE and H3 PART/PARTSERVICE contracts', () => {
  assert.equal(validateH23ImportType('H2', 'SERVICE'), true);
  assert.equal(validateH23ImportType('H2', 'PART'), false);
  assert.equal(validateH23ImportType('H3', 'PART'), true);
  assert.equal(validateH23ImportType('H3', 'PARTSERVICE'), true);
  assert.equal(validateH23ImportType('H3', 'SERVICE'), false);
});

test('validateH23RowContract rejects incomplete H3 rows', () => {
  assert.equal(validateH23RowContract('H3', {
    invoiceNumber: 'INV-999',
    itemNumber: 'B-200',
    transactionType: 'PART',
    quantity: 1,
    price: 120000,
    grossAmount: 120000,
    groupPart: null,
  }), false);

  assert.equal(validateH23RowContract('H3', {
    invoiceNumber: 'INV-999',
    itemNumber: 'B-200',
    transactionType: 'PART',
    quantity: 1,
    price: 120000,
    grossAmount: 120000,
    groupPart: 'OLI',
  }), true);
});
