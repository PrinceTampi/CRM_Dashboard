import test from 'node:test';
import assert from 'node:assert/strict';

import { computeRcrMetrics, normalizePhone } from './rcr-data.ts';

test('normalizePhone strips formatting and country code', () => {
  assert.equal(normalizePhone('+62 812-3456-7890'), '81234567890');
  assert.equal(normalizePhone('081234567890'), '81234567890');
  assert.equal(normalizePhone(' 0812 3456 7890 '), '81234567890');
});

test('computeRcrMetrics counts repeat customers for a specific month', () => {
  const rows = [
    { phone: '081234567890', date: '2026-08-01', dealer: 'Dealer A', segment: 'Regular', category: 'Service' },
    { phone: '081234567890', date: '2026-08-10', dealer: 'Dealer A', segment: 'Regular', category: 'Service' },
    { phone: '081234567891', date: '2026-08-05', dealer: 'Dealer A', segment: 'Regular', category: 'Service' },
    { phone: '081234567892', date: '2026-07-15', dealer: 'Dealer A', segment: 'Regular', category: 'Service' },
  ];

  const result = computeRcrMetrics(rows, '2026-08');

  assert.equal(result.totalCustomer, 2);
  assert.equal(result.repeatCustomer, 1);
  assert.equal(result.rcr, 50);
});
