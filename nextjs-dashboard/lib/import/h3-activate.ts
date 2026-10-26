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
  contactLabel: string | null;
  progressStatus: string | null;
  prospectStatus: string | null;
  notDealReason: string | null;
  followedUpAt: Date | null;
  hasFollowUp: string | null;
  raw: Record<string, unknown>;
};

export type H3H23MatchStatus = 'both' | 'phone' | 'name' | 'conflict' | 'none';

export type H23CustomerIdentity = {
  name: string;
  normalizedName: string;
  phone: string | null;
};

const HEADER_ALIASES: Record<string, string> = {
  id: 'source_id',
  'id (jangan dirubah/modify/digeser)': 'source_id',
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
  'lebel contact': 'contact_label',
  'label contact': 'contact_label',
  'lebel_contact': 'contact_label',
  'progress fu': 'progress_status',
  'progress_fu': 'progress_status',
  'prospect status': 'prospect_status',
  'prospect_status': 'prospect_status',
  'alasan not deal': 'alasan_not_deal',
  'alasan_not_deal': 'alasan_not_deal',
  'waktu follow up': 'followed_up_at',
  'waktu_follow_up': 'followed_up_at',
  'identify has fu': 'has_follow_up',
  'identify_has_fu': 'has_follow_up',
};

function normalizeText(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeH3Phone(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const digits = text.replace(/\D+/g, '');
  if (!digits) return null;

  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits.startsWith('0') ? digits : `0${digits}`;
}

export function normalizeH3CustomerName(value: string | null | undefined): string | null {
  const text = normalizeText(value);
  return text ? text.toLowerCase().replace(/\s+/g, ' ') : null;
}

export function compareH3IdentityToH23(
  name: string | null | undefined,
  phone: string | null | undefined,
  h23Customers: H23CustomerIdentity[],
): { status: H3H23MatchStatus; matchedByPhone: boolean; matchedByName: boolean } {
  const normalizedName = normalizeH3CustomerName(name);
  const normalizedPhone = normalizeH3Phone(phone);
  const matchedByPhone = Boolean(normalizedPhone && h23Customers.some((customer) => normalizeH3Phone(customer.phone) === normalizedPhone));
  const matchedByName = Boolean(normalizedName && h23Customers.some((customer) => (
    normalizeH3CustomerName(customer.normalizedName || customer.name) === normalizedName
  )));
  const matchedSameCustomer = Boolean(normalizedName && normalizedPhone && h23Customers.some((customer) => (
    normalizeH3CustomerName(customer.normalizedName || customer.name) === normalizedName &&
    normalizeH3Phone(customer.phone) === normalizedPhone
  )));

  const status: H3H23MatchStatus = matchedSameCustomer
    ? 'both'
    : matchedByPhone && matchedByName
      ? 'conflict'
      : matchedByPhone
        ? 'phone'
        : matchedByName
          ? 'name'
          : 'none';

  return { status, matchedByPhone, matchedByName };
}

function parseDateTime(value: string | number | null | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  const localDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
  if (localDateTime) {
    const [, yearText, monthText, dayText, hourText = '00', minuteText = '00', secondText = '00', millisecondText = '0'] = localDateTime;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const milliseconds = Number(millisecondText.padEnd(3, '0'));
    const calendarDate = new Date(Date.UTC(year, month - 1, day));
    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second, milliseconds));
  }

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
  const phone = [row.no_hp, row['No HP'], row.no_telp, row['No Telp']]
    .map((value) => normalizeText(value))
    .find((value) => value !== null);

  const normalized: NormalizedH3ActivationRow = {
    sourceId: parseNumber(row.id ?? row.ID ?? row['Id'] ?? row['ID (JANGAN DIRUBAH/MODIFY/DIGESER)']) ?? null,
    uploadedAt: parseDateTime(row.waktu_upload ?? row['Waktu Upload']),
    assignedAt: parseDateTime(row.waktu_assign ?? row['Waktu Assign']),
    customerName: normalizeText(row.nama ?? row['Nama']),
    noHp: normalizeH3Phone(phone),
    mdCode: normalizeText(row.md ?? row['MD'])?.toUpperCase() ?? null,
    assignedDealerCode: normalizeText(row.assigned_dealer ?? row['Assigned Dealer'])?.toUpperCase() ?? null,
    sourceData: normalizeText(row.source_data ?? row['Source Data']),
    contactStatus: normalizeText(row.status_contact ?? row['Status Contact']),
    contactLabel: normalizeText(row.contact_label ?? row['Lebel Contact'] ?? row['Label Contact']),
    progressStatus: normalizeText(row.progress_status ?? row['Progress FU']),
    prospectStatus: normalizeText(row.prospect_status ?? row['Prospect Status']),
    notDealReason: normalizeText(row.alasan_not_deal ?? row['Alasan Not Deal']),
    followedUpAt: parseDateTime(row.followed_up_at ?? row['Waktu Follow Up']),
    hasFollowUp: normalizeText(row.identify_has_fu ?? row['Identify Has FU'])?.toUpperCase() ?? null,
    raw: { ...row },
  };

  return normalized;
}
