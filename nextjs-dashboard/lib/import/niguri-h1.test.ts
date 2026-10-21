import test from 'node:test';
import assert from 'node:assert/strict';

import { aggregateNiguriProspectRows, NIGURI_H1_SOURCE_CHANNELS } from './niguri-h1.ts';

const headers = ['ID Guestbook', 'ID Leads', 'Tgl Input Guestbook', 'Channel Penjualan', 'Contact Status', 'Sudah membeli', 'Status', 'Dealer'];

test('aggregates DataProspek rows into monthly Niguri source snapshots', () => {
  const result = aggregateNiguriProspectRows(headers, [
    ['G-1', 'L-1', '2026-09-05 10:00:00', 'CRM Leads H1 - H1 (Hanya Beli)', 'CONTACTED', 'NO', 'Need FU', '13864'],
    ['G-2', '', '2026-09-06 10:00:00', 'CRM Leads H1 - H1 (Hanya Beli)', '', 'YES', 'Deal SPK Non Indent', '13864'],
    ['G-3', 'L-3', '2026-10-01 10:00:00', 'CRM Leads H2 Own - H1 (Beli & Servis)', 'CONTACTED', 'NO', 'No Deal', '13864'],
    ['G-4', 'L-4', '2026-09-07 10:00:00', 'Walk In', '', 'NO', 'Need FU', '13864'],
  ]);

  assert.equal(result.aggregates.length, 6);
  assert.deepEqual(result.aggregates.find((item) => item.month === '2026-09' && item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[0]), {
      month: '2026-09',
      sourceCategory: NIGURI_H1_SOURCE_CHANNELS[0],
      totalDataSource: 2,
      totalDataAnalysisResult: 2,
      totalDataFollowupPhone: 1,
      callContacted: 1,
      callUnreachable: 0,
      callRejected: 0,
      callWorkload: 1,
      totalProspect: 2,
      totalCustomerDeal: 1,
      totalUnitSold: 1,
      sourceRows: 2,
  });
  assert.deepEqual(result.aggregates.find((item) => item.month === '2026-09' && item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[1]), {
      month: '2026-09',
      sourceCategory: NIGURI_H1_SOURCE_CHANNELS[1],
      totalDataSource: 0,
      totalDataAnalysisResult: 0,
      totalDataFollowupPhone: 0,
      callContacted: 0,
      callUnreachable: 0,
      callRejected: 0,
      callWorkload: 0,
      totalProspect: 0,
      totalCustomerDeal: 0,
      totalUnitSold: 0,
      sourceRows: 0,
  });
  assert.deepEqual(result.aggregates.find((item) => item.month === '2026-10' && item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[1]), {
      month: '2026-10',
      sourceCategory: NIGURI_H1_SOURCE_CHANNELS[1],
      totalDataSource: 1,
      totalDataAnalysisResult: 1,
      totalDataFollowupPhone: 1,
      callContacted: 1,
      callUnreachable: 0,
      callRejected: 0,
      callWorkload: 0,
      totalProspect: 1,
      totalCustomerDeal: 0,
      totalUnitSold: 0,
      sourceRows: 1,
  });
  assert.equal(result.ignoredChannelRows, 1);
  assert.equal(result.ignoredContactStatusRows, 0);
  assert.deepEqual(result.dealerCodes, ['13864']);
});

test('deduplicates guestbook rows within a source group and validates source headers', () => {
  const result = aggregateNiguriProspectRows(headers, [
    ['G-1', 'L-1', '2026-09-05', 'CRM Leads H1 - H1 (Hanya Beli)', '', 'NO', 'Need FU', '13864'],
    ['G-1', 'L-1', '2026-09-06', 'CRM Leads H1 - H1 (Hanya Beli)', 'CONTACTED', 'YES', 'Deal SPK Indent', '13864'],
  ]);

  assert.equal(result.duplicateRows, 1);
  assert.equal(result.aggregates.length, 3);
  const source = result.aggregates.find((item) => item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[0]);
  assert.equal(source?.totalDataSource, 1);
  assert.equal(source?.month, '2026-09');
  assert.equal(source?.callContacted, 1);
  assert.equal(source?.callWorkload, 0);
  assert.equal(source?.totalUnitSold, 1);
  assert.throws(
    () => aggregateNiguriProspectRows(['Nama Prospek'], []),
    /Kolom wajib DataProspek tidak ditemukan/,
  );
});

test('filters Contact Status values and counts only the two SPK deal statuses', () => {
  const result = aggregateNiguriProspectRows(headers, [
    ['G-1', 'L-1', '2026-09-05', 'CRM Leads H1 - H1 (Hanya Beli)', 'FAILED', 'YES', 'Deal SPK Indent', '13864'],
    ['G-2', 'L-2', '2026-09-05', 'CRM Leads H1 - H1 (Hanya Beli)', '(Blanks)', 'YES', 'Deal (Draft SPK)', '13864'],
    ['G-3', 'L-3', '2026-09-05', 'CRM Leads H1 - H1 (Hanya Beli)', 'CONTACTED', 'NO', 'Deal SPK Indent', '13864'],
    ['G-4', 'L-4', '2026-09-05', 'CRM Leads H2 Others - H1 (Hanya Servis)', 'UNREACHABLE', 'NO', 'Deal SPK Non Indent', '13864'],
    ['G-5', 'L-5', '2026-09-05', 'CRM Leads H2 Own - H1 (Beli & Servis)', 'REJECTED', 'NO', 'Deal SPK Indent', '13864'],
  ]);

  const h1 = result.aggregates.find((item) => item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[0]);
  const h2Others = result.aggregates.find((item) => item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[2]);
  const h2Own = result.aggregates.find((item) => item.sourceCategory === NIGURI_H1_SOURCE_CHANNELS[1]);
  assert.equal(result.ignoredContactStatusRows, 1);
  assert.equal(h1?.totalDataSource, 2);
  assert.equal(h1?.callWorkload, 1);
  assert.equal(h1?.callContacted, 1);
  assert.equal(h1?.totalCustomerDeal, 1);
  assert.equal(h1?.totalUnitSold, 1);
  assert.equal(h2Others?.totalCustomerDeal, 1);
  assert.equal(h2Own?.callRejected, 1);
  assert.equal(h2Own?.totalCustomerDeal, 1);
});
