export type LcrSourceRow = Record<string, string | number | null | undefined>;

export type NormalizedLcrRow = {
  engineNumber: string | null;
  frameNumber: string | null;
  customerName: string | null;
  phone: string | null;
  nik: string | null;
  motor: string | null;
  district: string | null;
  dealerCode: string | null;
  operatingDealer: string | null;
  ring: string | null;
  isTreated: boolean;
  treatmentStatus: string | null;
  raw: Record<string, unknown>;
};

const HEADER_ALIASES: Record<string, string> = {
  'nomor mesin': 'nomor_mesin',
  'nomor_mesin': 'nomor_mesin',
  'nomor rangka': 'nomor_rangka',
  'nomor_rangka': 'nomor_rangka',
  'kode dealer': 'kode_dealer',
  'kode_dealer': 'kode_dealer',
  'nama dealer 2': 'nama_dealer_2',
  'nama_dealer_2': 'nama_dealer_2',
  'area ring': 'area_ring',
  'area_ring': 'area_ring',
  'sudah dilakukan pengerjaan': 'sudah_dilakukan_pengerjaan',
  'sudah dilakukan pengerjaan (treatment/penggantian)': 'sudah_dilakukan_pengerjaan',
  'sudah_dilakukan_pengerjaan': 'sudah_dilakukan_pengerjaan',
  'sudah_dilakukan_pengerjaan_(treatment/penggantian)': 'sudah_dilakukan_pengerjaan',
  'nama konsumen': 'nama_konsumen',
  'nama_konsumen': 'nama_konsumen',
  'no hp': 'no_hp',
  'no_hp': 'no_hp',
  'tipe motor': 'tipe_motor',
  'type motor': 'tipe_motor',
  'kecamatan': 'kecamatan',
};

function normalizeText(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeIdentifier(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  return text.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function normalizePhone(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  const digits = text.replace(/\D+/g, '');
  if (!digits) return null;
  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits.startsWith('0') ? digits : `0${digits}`;
}

export function buildLcrHeaderMap(headers: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};

  for (const rawHeader of headers) {
    const key = normalizeText(rawHeader)?.toLowerCase();
    if (!key) continue;

    const canonical = HEADER_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
    map[key] = canonical;
  }

  return map;
}

export function normalizeLcrRow(row: LcrSourceRow): NormalizedLcrRow {
  const treatmentStatus = normalizeText(row.sudah_dilakukan_pengerjaan ?? row['Sudah dilakukan Pengerjaan']);
  const isTreated = treatmentStatus ? /sudah\s+lcr|treated|done|selesai/i.test(treatmentStatus) : false;

  const normalized: NormalizedLcrRow = {
    engineNumber: normalizeIdentifier(row.nomor_mesin ?? row['Nomor Mesin']),
    frameNumber: normalizeIdentifier(row.nomor_rangka ?? row['Nomor Rangka']),
    customerName: normalizeText(row.nama_konsumen ?? row['Nama Konsumen']),
    phone: normalizePhone(row.no_hp ?? row['No HP']),
    nik: normalizeText(row.no_ktp ?? row['No KTP']),
    motor: normalizeText(row.tipe_motor ?? row['Tipe Motor'] ?? row['Type Motor']),
    district: normalizeText(row.kecamatan ?? row['Kecamatan']),
    dealerCode: normalizeText(row.kode_dealer ?? row['Kode Dealer'])?.toUpperCase() ?? null,
    operatingDealer: normalizeText(row.nama_dealer_2 ?? row['Nama Dealer 2']),
    ring: normalizeText(row.area_ring ?? row['Area Ring']),
    isTreated,
    treatmentStatus: treatmentStatus ?? null,
    raw: { ...row },
  };

  return normalized;
}
