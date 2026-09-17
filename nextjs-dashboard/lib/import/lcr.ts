export type LcrSourceRow = Record<string, string | number | null | undefined>;

export type NormalizedLcrRow = {
  engineNumber: string | null;
  frameNumber: string | null;
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
  'sudah_dilakukan_pengerjaan': 'sudah_dilakukan_pengerjaan',
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
    dealerCode: normalizeText(row.kode_dealer ?? row['Kode Dealer'])?.toUpperCase() ?? null,
    operatingDealer: normalizeText(row.nama_dealer_2 ?? row['Nama Dealer 2']),
    ring: normalizeText(row.area_ring ?? row['Area Ring']),
    isTreated,
    treatmentStatus: treatmentStatus ?? null,
    raw: { ...row },
  };

  return normalized;
}
