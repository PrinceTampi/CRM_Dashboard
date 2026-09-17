export type ProspectSourceRow = Record<string, string | number | null | undefined>;

export type NormalizedProspectRow = {
  leadId: string | null;
  guestbookId: string | null;
  guestbookAt: Date | null;
  customerName: string | null;
  phone: string | null;
  salesChannel: string | null;
  prospectType: string | null;
  customerType: string | null;
  assignedDealerCode: string | null;
  status: string | null;
  raw: Record<string, unknown>;
};

const HEADER_ALIASES: Record<string, string> = {
  'id leads': 'lead_id',
  'id guestbook': 'guestbook_id',
  'tgl input guestbook': 'guestbook_at',
  'channel penjualan': 'sales_channel',
  'nama prospek': 'customer_name',
  'no. hp prospek': 'phone',
  'no_hp_prospek': 'phone',
  'no hp prospek': 'phone',
  'tipe prospek': 'prospect_type',
  'tipe customer': 'customer_type',
  dealer: 'assigned_dealer',
  status: 'status',
};

function normalizeText(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function normalizePhone(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const digits = text.replace(/\D+/g, '');
  if (!digits) return null;

  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits.startsWith('0') ? digits : `0${digits}`;
}

function parseDateValue(value: string | number | null | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildProspectHeaderMap(headers: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};

  for (const rawHeader of headers) {
    const key = normalizeText(rawHeader)?.toLowerCase();
    if (!key) continue;

    const canonical = HEADER_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
    map[key] = canonical;
  }

  return map;
}

export function normalizeProspectRow(row: ProspectSourceRow): NormalizedProspectRow {
  const normalized: NormalizedProspectRow = {
    leadId: normalizeText(row['ID Leads'] ?? row.lead_id ?? row.leadId),
    guestbookId: normalizeText(row['ID Guestbook'] ?? row.guestbook_id ?? row.guestbookId),
    guestbookAt: parseDateValue(row['Tgl Input Guestbook'] ?? row.guestbook_at ?? row.guestbookAt),
    customerName: normalizeText(row['Nama Prospek'] ?? row.customer_name ?? row.name),
    phone: normalizePhone(row['No. HP Prospek'] ?? row['No HP Prospek'] ?? row.phone),
    salesChannel: normalizeText(row['Channel Penjualan'] ?? row.sales_channel),
    prospectType: normalizeText(row['Tipe Prospek'] ?? row.prospect_type),
    customerType: normalizeText(row['Tipe Customer'] ?? row.customer_type),
    assignedDealerCode: normalizeText(row['Dealer'] ?? row.assigned_dealer ?? row.dealer)?.toUpperCase() ?? null,
    status: normalizeText(row['Status'] ?? row.status),
    raw: { ...row },
  };

  return normalized;
}
