export type H1SourceRow = Record<string, string | number | null | undefined>;

export type NormalizedH1Row = {
  no: number | null;
  kode_dealer: string | null;
  tanggal_faktur: Date | null;
  nama_konsumen: string | null;
  no_ktp: string | null;
  tanggal_lahir: Date | null;
  no_hp: string | null;
  no_telp: string | null;
  jenis_bayar: string | null;
  nomor_mesin: string | null;
  nomor_rangka: string | null;
  tipe_dan_warna: string | null;
  status_faktur: string | null;
  raw: Record<string, unknown>;
};

const HEADER_ALIASES: Record<string, string> = {
  no: 'no',
  'kode dealer': 'kode_dealer',
  'kode_dealer': 'kode_dealer',
  'tanggal faktur': 'tanggal_faktur',
  'tanggal_faktur': 'tanggal_faktur',
  'nama konsumen': 'nama_konsumen',
  'nama_konsumen': 'nama_konsumen',
  'no ktp': 'no_ktp',
  'no_ktp': 'no_ktp',
  'tanggal lahir': 'tanggal_lahir',
  'tanggal_lahir': 'tanggal_lahir',
  'no hp': 'no_hp',
  'no_hp': 'no_hp',
  'no telp': 'no_telp',
  'no_telp': 'no_telp',
  'jenis bayar': 'jenis_bayar',
  'jenis_bayar': 'jenis_bayar',
  'nomor mesin': 'nomor_mesin',
  'nomor_mesin': 'nomor_mesin',
  'nomor rangka': 'nomor_rangka',
  'nomor_rangka': 'nomor_rangka',
  'tipe dan warna': 'tipe_dan_warna',
  'tipe_dan_warna': 'tipe_dan_warna',
  'status faktur': 'status_faktur',
  'status_faktur': 'status_faktur',
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

function normalizeMachineId(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  return text.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '');
}

function parseDateValue(value: string | number | null | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  const cleaned = text.replace(/\s+/g, ' ').trim();
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
  };

  const dateLike = cleaned.replace(/\./g, '');

  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(dateLike)) {
    const [dayPart, monthPart, yearPart] = dateLike.split(/[/-]/);
    const day = Number(dayPart);
    const month = Number(monthPart) - 1;
    const year = Number(yearPart);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/.test(dateLike)) {
    const [dayPart, monthText, yearPart] = dateLike.split(/\s+/);
    const day = Number(dayPart);
    const month = monthMap[monthText.slice(0, 3).toLowerCase()];
    const year = Number(yearPart);
    if (Number.isInteger(month) && Number.isFinite(day) && Number.isFinite(year)) {
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildH1HeaderMap(headers: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};

  for (const rawHeader of headers) {
    const key = normalizeText(rawHeader)?.toLowerCase();
    if (!key) continue;

    const canonical = HEADER_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
    map[key] = canonical;
  }

  return map;
}

export function normalizeH1Row(row: H1SourceRow): NormalizedH1Row {
  const normalized: NormalizedH1Row = {
    no: normalizeText(row.no) ? Number(String(row.no).replace(/[^0-9]/g, '')) || null : null,
    kode_dealer: normalizeText(row.kode_dealer),
    tanggal_faktur: parseDateValue(row.tanggal_faktur),
    nama_konsumen: normalizeText(row.nama_konsumen),
    no_ktp: normalizeText(row.no_ktp)?.replace(/\D+/g, '') || null,
    tanggal_lahir: parseDateValue(row.tanggal_lahir),
    no_hp: normalizePhone(row.no_hp ?? row['no hp'] ?? row['No HP']),
    no_telp: normalizePhone(row.no_telp ?? row['no telp'] ?? row['No Telp']),
    jenis_bayar: normalizeText(row.jenis_bayar ?? row['jenis bayar']),
    nomor_mesin: normalizeMachineId(row.nomor_mesin ?? row['nomor mesin']),
    nomor_rangka: normalizeMachineId(row.nomor_rangka ?? row['nomor rangka']),
    tipe_dan_warna: normalizeText(row.tipe_dan_warna ?? row['tipe dan warna']),
    status_faktur: normalizeText(row.status_faktur ?? row['status faktur']),
    raw: { ...row },
  };

  return normalized;
}
