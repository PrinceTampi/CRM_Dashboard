export const NIGURI_H1_SOURCE_CHANNELS = [
  'CRM Leads H1 - H1 (Hanya Beli)',
  'CRM Leads H2 Own - H1 (Beli & Servis)',
  'CRM Leads H2 Others - H1 (Hanya Servis)',
] as const;

export type NiguriH1SourceChannel = (typeof NIGURI_H1_SOURCE_CHANNELS)[number];

export type NiguriH1Aggregate = {
  month: string;
  sourceCategory: NiguriH1SourceChannel;
  totalDataSource: number;
  totalDataAnalysisResult: number;
  totalDataFollowupPhone: number;
  callContacted: number;
  callUnreachable: number;
  callRejected: number;
  callWorkload: number;
  totalProspect: number;
  totalCustomerDeal: number;
  totalUnitSold: number;
  sourceRows: number;
};

export type NiguriH1AggregationResult = {
  aggregates: NiguriH1Aggregate[];
  inputRows: number;
  duplicateRows: number;
  invalidRows: number;
  ignoredChannelRows: number;
  ignoredContactStatusRows: number;
  dealerCodes: string[];
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function asText(value: unknown): string {
  return String(value ?? '').trim();
}

function getMonth(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }
  const text = asText(value);
  const isoDate = text.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}`;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

function getSourceChannel(value: unknown): NiguriH1SourceChannel | null {
  const normalized = asText(value).toLowerCase().replace(/\s+/g, ' ');
  return NIGURI_H1_SOURCE_CHANNELS.find((channel) => channel.toLowerCase().replace(/\s+/g, ' ') === normalized) ?? null;
}

function getContactStatus(value: unknown): 'contacted' | 'unreachable' | 'rejected' | 'workload' | null {
  const normalized = asText(value).toLowerCase().replace(/\s+/g, ' ');
  if (!normalized || normalized === '(blanks)') return 'workload';
  if (normalized === 'contacted') return 'contacted';
  if (normalized === 'unreachable') return 'unreachable';
  if (normalized === 'rejected') return 'rejected';
  return null;
}

export function aggregateNiguriProspectRows(
  headers: unknown[],
  rows: unknown[][],
): NiguriH1AggregationResult {
  const indexes = new Map(headers.map((header, index) => [normalizeHeader(header), index]));
  const required = [
    'tgl_input_guestbook',
    'channel_penjualan',
    'contact_status',
    'status',
  ];
  const missing = required.filter((header) => !indexes.has(header));
  if (!indexes.has('id_guestbook') && !indexes.has('id_leads')) missing.push('id_guestbook atau id_leads');
  if (missing.length > 0) {
    throw new Error(`Kolom wajib DataProspek tidak ditemukan: ${missing.join(', ')}.`);
  }

  const column = (row: unknown[], header: string) => {
    const index = indexes.get(header);
    return index === undefined ? '' : row[index];
  };
  const dealerIndex = indexes.get('dealer');
  const dealerCodes = new Set<string>();
  const uniqueRows = new Map<string, {
    month: string;
    sourceCategory: NiguriH1SourceChannel;
    status: string;
    contactStatus: 'contacted' | 'unreachable' | 'rejected' | 'workload';
  }>();
  let duplicateRows = 0;
  let invalidRows = 0;
  let ignoredChannelRows = 0;
  let ignoredContactStatusRows = 0;

  for (const row of rows) {
    if (!row.some((cell) => asText(cell))) continue;
    const sourceCategory = getSourceChannel(column(row, 'channel_penjualan'));
    if (!sourceCategory) {
      ignoredChannelRows += 1;
      continue;
    }
    const contactStatus = getContactStatus(column(row, 'contact_status'));
    if (!contactStatus) {
      ignoredContactStatusRows += 1;
      continue;
    }

    const guestbookId = asText(column(row, 'id_guestbook'));
    const leadId = asText(column(row, 'id_leads'));
    const identifier = guestbookId || leadId;
    const month = getMonth(column(row, 'tgl_input_guestbook'));
    if (!identifier || !month) {
      invalidRows += 1;
      continue;
    }

    const dealerCode = dealerIndex === undefined ? '' : asText(row[dealerIndex]);
    if (dealerCode) dealerCodes.add(dealerCode);

    const key = `${sourceCategory}:${identifier}`;
    if (uniqueRows.has(key)) duplicateRows += 1;
    uniqueRows.set(key, {
      month,
      sourceCategory,
      status: asText(column(row, 'status')),
      contactStatus,
    });
  }

  const aggregates = new Map<string, NiguriH1Aggregate>();
  for (const item of uniqueRows.values()) {
    const key = `${item.month}:${item.sourceCategory}`;
    const aggregate = aggregates.get(key) ?? {
      month: item.month,
      sourceCategory: item.sourceCategory,
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
    };
    const normalizedStatus = item.status.trim().toLowerCase();
    const isDeal = normalizedStatus === 'deal spk indent' || normalizedStatus === 'deal spk non indent';
    aggregate.totalDataSource += 1;
    aggregate.totalDataAnalysisResult += Number(Boolean(item.status));
    aggregate.totalDataFollowupPhone += Number(item.contactStatus !== 'workload');
    aggregate.callContacted += Number(item.contactStatus === 'contacted');
    aggregate.callUnreachable += Number(item.contactStatus === 'unreachable');
    aggregate.callRejected += Number(item.contactStatus === 'rejected');
    aggregate.callWorkload += Number(item.contactStatus === 'workload');
    aggregate.totalProspect += 1;
    aggregate.totalCustomerDeal += Number(isDeal);
    aggregate.totalUnitSold += Number(isDeal);
    aggregate.sourceRows += 1;
    aggregates.set(key, aggregate);
  }

  const months = new Set([...aggregates.values()].map((item) => item.month));
  for (const month of months) {
    for (const sourceCategory of NIGURI_H1_SOURCE_CHANNELS) {
      const key = `${month}:${sourceCategory}`;
      if (!aggregates.has(key)) {
        aggregates.set(key, {
          month,
          sourceCategory,
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
      }
    }
  }

  return {
    aggregates: [...aggregates.values()].sort((a, b) => a.month.localeCompare(b.month) || a.sourceCategory.localeCompare(b.sourceCategory)),
    inputRows: rows.filter((row) => row.some((cell) => asText(cell))).length,
    duplicateRows,
    invalidRows,
    ignoredChannelRows,
    ignoredContactStatusRows,
    dealerCodes: [...dealerCodes].sort(),
  };
}
