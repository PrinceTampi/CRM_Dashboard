import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeJsonValue } from './upload-safe.ts';

test('sanitizeJsonValue removes invalid JSON control characters and preserves plain values', () => {
  const payload = {
    row: {
      customer: 'Rizal\u0000Tono',
      notes: 'A\\B',
      nested: { text: 'line\nnext' },
    },
    headerMap: { 'Nama Customer': 'customerName' },
    rawList: ['ok', 'bad\u0001value'],
  };

  const sanitized = sanitizeJsonValue(payload);

  assert.deepEqual(sanitized.row.customer, 'RizalTono');
  assert.deepEqual(sanitized.row.notes, 'A\\B');
  assert.deepEqual(sanitized.rawList[1], 'badvalue');
  assert.deepEqual(sanitized.headerMap, { 'Nama Customer': 'customerName' });
});

test('sanitizeJsonValue converts unsupported values into safe JSON-friendly primitives', () => {
  const payload = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    amount: 123.45,
    ok: true,
    maybe: undefined,
    list: [null, 'text', undefined],
  } as any;

  const sanitized = sanitizeJsonValue(payload);

  assert.equal(sanitized.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(sanitized.amount, 123.45);
  assert.equal(sanitized.ok, true);
  assert.equal('maybe' in sanitized, false);
  assert.deepEqual(sanitized.list, [null, 'text', null]);
});

test('sanitizeJsonValue removes lone Unicode surrogates from spreadsheet text and keys', () => {
  const sanitized = sanitizeJsonValue({ 'header\uD800': 'value\uDFFF' });

  assert.deepEqual(sanitized, { header: 'value' });
  assert.doesNotThrow(() => JSON.stringify(sanitized));
});
