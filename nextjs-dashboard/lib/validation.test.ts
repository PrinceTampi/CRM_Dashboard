import test from 'node:test';
import assert from 'node:assert/strict';

import { validateEventPayload, validateLcrPayload, validatePasswordUpdatePayload, validateUserCreatePayload } from './validation.ts';
import { spreadsheetTextFromRows } from './crm-data';

test('validateEventPayload rejects invalid phone and short engine numbers', () => {
  const invalid = validateEventPayload({
    name: 'Test User',
    phone: '12',
    engine: 'abc',
  });

  assert.equal(invalid.ok, false);
  assert.match(invalid.message ?? '', /Nomor HP|Nomor Mesin/i);

  const valid = validateEventPayload({
    name: 'Test User',
    phone: '+62 812-3456-7890',
    engine: 'MH1A1234567',
    location: 'AHASS Kombos',
  });

  assert.equal(valid.ok, true);
  assert.equal(valid.data?.phone, '081234567890');
  assert.equal(valid.data?.engineNumber, 'MH1A1234567');
});

test('validateLcrPayload normalizes contact data and preserves required values', () => {
  const result = validateLcrPayload({
    name: '  Test  ',
    phone: '0812-3456-7890',
    nik: ' 3201010101010001 ',
    motor: 'Beat Street',
    district: 'Kombos',
    status: 'Prospek',
    contact: 'Terhubung',
    result: 'Follow Up',
  });

  assert.equal(result.ok, true);
  assert.equal(result.data?.name, 'Test');
  assert.equal(result.data?.phone, '081234567890');
  assert.equal(result.data?.nik, '3201010101010001');
});

test('validateUserCreatePayload and validatePasswordUpdatePayload enforce admin account rules', () => {
  const created = validateUserCreatePayload({
    name: '  Admin Baru  ',
    email: 'admin.baru@example.com',
    password: 'secret123',
    role: 'admin',
  });

  assert.equal(created.ok, true);
  assert.equal(created.data?.role, 'ADMIN');
  assert.equal(created.data?.email, 'admin.baru@example.com');

  const updated = validatePasswordUpdatePayload({ password: 'newPassword123' });
  assert.equal(updated.ok, true);
  assert.equal(updated.data?.password, 'newPassword123');

  const invalidPassword = validatePasswordUpdatePayload({ password: '123' });
  assert.equal(invalidPassword.ok, false);
  assert.match(invalidPassword.message ?? '', /minimal 6/i);
});

test('spreadsheetTextFromRows keeps tab-delimited structure and preserves values', () => {
  const text = spreadsheetTextFromRows(['Nama', 'No HP', 'Status'], [
    ['Andi', '0812', 'Terhubung'],
    ['Budi', '0813', 'Belum'],
  ]);

  assert.equal(text, 'Nama\tNo HP\tStatus\nAndi\t0812\tTerhubung\nBudi\t0813\tBelum');
});
