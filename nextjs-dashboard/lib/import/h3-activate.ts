export type H3ActivationSourceRow = Record<string, string | number | null | undefined>;

export type NormalizedH3ActivationRow = {
  sourceId: number | null;
  uploadedAt: Date | null;
  assignedAt: Date | null;
  customerName: string | null;
  noHp: string | null;
  mdCode: string | null;
  assignedDealerCode: string | null;
  sourceData: string | null;
  contactStatus: string | null;
  notDealReason: string | null;
  hasFollowUp: string | null;
  raw: Record<string, unknown>;
};

const HEADER_ALIASES: Record<string, string> = {
  id: 'source_id',
  'waktu upload': 'uploaded_at',
  'waktu_upload': 'uploaded_at',
  'waktu assign': 'assigned_at',
  'waktu_assign': 'assigned_at',
  nama: 'nama',
  'no hp': 'no_hp',
  'no_hp': 'no_hp',
  'no telp': 'no_telp',
  'no_telp': 'no_telp',
  md: 'md_code',
  'assigned dealer': 'assigned_dealer',
  'assigned_dealer': 'assigned_dealer',
  'source data': 'source_data',
  'source_data': 'source_data',
  'status contact': 'status_contact',
  'status_contact': 'status_contact',
  'alasan not deal': 'alasan_not_deal',
  'alasan_not_deal': 'alasan_not_deal',
  'identify has fu': 'has_follow_up',
  'identify_has_fu': 'has_follow_up',
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

function parseDateTime(value: string | number | null | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string | number | null | undefined): number | null {
  const text = normalizeText(value);
  if (!text) return null;

  const numeric = Number(String(text).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function buildH3ActivationHeaderMap(headers: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};

  for (const rawHeader of headers) {
    const key = normalizeText(rawHeader)?.toLowerCase();
    if (!key) continue;

    const canonical = HEADER_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
    map[key] = canonical;
  }

  return map;
}

export function normalizeH3ActivationRow(row: H3ActivationSourceRow): NormalizedH3ActivationRow {
  const normalized: NormalizedH3ActivationRow = {
    sourceId: parseNumber(row.id ?? row.ID ?? row['Id']) ?? null,
    uploadedAt: parseDateTime(row.waktu_upload ?? row['Waktu Upload']),
    assignedAt: parseDateTime(row.waktu_assign ?? row['Waktu Assign']),
    customerName: normalizeText(row.nama ?? row['Nama']),
    noHp: normalizePhone(row.no_hp ?? row['No HP'] ?? row.no_telp ?? row['No Telp']),
    mdCode: normalizeText(row.md ?? row['MD'])?.toUpperCase() ?? null,
    assignedDealerCode: normalizeText(row.assigned_dealer ?? row['Assigned Dealer'])?.toUpperCase() ?? null,
    sourceData: normalizeText(row.source_data ?? row['Source Data']),
    contactStatus: normalizeText(row.status_contact ?? row['Status Contact']),
    notDealReason: normalizeText(row.alasan_not_deal ?? row['Alasan Not Deal']),
    hasFollowUp: normalizeText(row.identify_has_fu ?? row['Identify Has FU'])?.toUpperCase() ?? null,
    raw: { ...row },
  };

  return normalized;
}
