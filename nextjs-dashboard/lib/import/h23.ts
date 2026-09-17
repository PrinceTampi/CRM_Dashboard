export type H23SourceRow = Record<string, string | number | null | undefined>;

export type NormalizedH23Row = {
  invoiceNumber: string | null;
  workOrderNumber: string | null;
  invoiceDate: Date | null;
  customerName: string | null;
  itemNumber: string | null;
  itemDescription: string | null;
  quantity: number | null;
  price: number | null;
  grossAmount: number | null;
  discountRate: number | null;
  discountAmount: number | null;
  transactionType: 'SERVICE' | 'PART' | 'PARTSERVICE' | null;
  dealerName: string | null;
  noHp: string | null;
  engineNumber: string | null;
  frameNumber: string | null;
  groupPart: string | null;
  raw: Record<string, unknown>;
};

const HEADER_ALIASES: Record<string, string> = {
  inv: 'inv_no',
  'inv no': 'inv_no',
  inv_no: 'inv_no',
  'tgl invoice': 'tgl_invoice',
  tgl_invoice: 'tgl_invoice',
  'cust name': 'cust_name',
  cust_name: 'cust_name',
  'ref no': 'ref_no',
  ref_no: 'ref_no',
  'item no': 'item_no',
  item_no: 'item_no',
  'item desc': 'item_desc',
  item_desc: 'item_desc',
  qty: 'qty',
  price: 'price',
  'gross amt': 'gross_amt',
  gross_amt: 'gross_amt',
  'disc rate': 'disc_rate',
  disc_rate: 'disc_rate',
  'disc amt': 'disc_amt',
  disc_amt: 'disc_amt',
  'jenis transaksi': 'jenis_transaksi',
  jenis_transaksi: 'jenis_transaksi',
  'dealer name': 'dealer_name',
  dealer_name: 'dealer_name',
  'no hp': 'no_hp',
  no_hp: 'no_hp',
  nosin: 'nosin',
  noka: 'noka',
  'group part': 'group_part',
  group_part: 'group_part',
};

function normalizeText(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeGroupPart(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const aliases: Record<string, string> = {
    mesin: 'MESIN',
    engine: 'MESIN',
    oli: 'OLI',
    oil: 'OLI',
    accs: 'ACCS',
    accessories: 'ACCS',
    rangka: 'RANGKA',
    frame: 'RANGKA',
    busi: 'BUSI',
    kelistrikan: 'KELISTRIKAN',
    elektrik: 'KELISTRIKAN',
    rubber: 'RUBBER',
    bearing: 'BEARING',
    plastik: 'PLASTIK',
    plastic: 'PLASTIK',
  };

  const upper = text.toUpperCase();
  return aliases[upper.toLowerCase()] || upper;
}

function normalizePhone(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const digits = text.replace(/\D+/g, '');
  if (!digits) return null;

  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits.startsWith('0') ? digits : `0${digits}`;
}

function normalizeIdentifier(value: string | number | null | undefined): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  return text.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function parseDateValue(value: string | number | null | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  const cleaned = text.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
  };

  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(cleaned)) {
    const [dayPart, monthPart, yearPart] = cleaned.split(/[/-]/);
    const day = Number(dayPart);
    const month = Number(monthPart) - 1;
    const year = Number(yearPart);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/.test(cleaned)) {
    const [dayPart, monthText, yearPart] = cleaned.split(/\s+/);
    const day = Number(dayPart);
    const month = monthMap[monthText.slice(0, 3).toLowerCase()];
    const year = Number(yearPart);

    if (Number.isInteger(month) && Number.isFinite(day) && Number.isFinite(year)) {
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string | number | null | undefined): number | null {
  const text = normalizeText(value);
  if (!text) return null;

  const numeric = Number(String(text).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function resolveH23ImportType(type: string | null | undefined): 'H2' | 'H3' | 'H23' {
  const normalized = String(type ?? '').trim().toUpperCase();
  if (normalized === 'H2') return 'H2';
  if (normalized === 'H3') return 'H3';
  return 'H23';
}

export function validateH23ImportType(type: string | null | undefined, transactionType: string | null | undefined): boolean {
  const normalizedType = resolveH23ImportType(type);
  const normalizedTransaction = normalizeText(transactionType)?.toUpperCase() ?? null;

  if (!normalizedTransaction) return false;

  if (normalizedType === 'H2') return normalizedTransaction === 'SERVICE';
  if (normalizedType === 'H3') return normalizedTransaction === 'PART' || normalizedTransaction === 'PARTSERVICE';
  return normalizedTransaction === 'SERVICE' || normalizedTransaction === 'PART' || normalizedTransaction === 'PARTSERVICE';
}

export function validateH23RowContract(type: string | null | undefined, row: Partial<NormalizedH23Row>): boolean {
  const normalizedType = resolveH23ImportType(type);
  if (!row.invoiceNumber || !row.itemNumber || !row.transactionType) return false;
  if (row.quantity === null || row.price === null || row.grossAmount === null) return false;

  if (normalizedType === 'H2') {
    return row.transactionType === 'SERVICE';
  }

  if (normalizedType === 'H3') {
    if (row.transactionType !== 'PART' && row.transactionType !== 'PARTSERVICE') return false;
    return Boolean(row.groupPart);
  }

  return true;
}

export function buildH23HeaderMap(headers: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};

  for (const rawHeader of headers) {
    const key = normalizeText(rawHeader)?.toLowerCase();
    if (!key) continue;

    const canonical = HEADER_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
    map[key] = canonical;
  }

  return map;
}

export function normalizeH23Row(row: H23SourceRow): NormalizedH23Row {
  const transactionType = normalizeText(row.jenis_transaksi ?? row['Jenis Transaksi'])?.toUpperCase();
  const transaction = transactionType === 'SERVICE' || transactionType === 'PART' || transactionType === 'PARTSERVICE'
    ? transactionType
    : null;

  const normalized: NormalizedH23Row = {
    invoiceNumber: normalizeText(row.inv_no ?? row['Inv No']),
    workOrderNumber: normalizeText(row.ref_no ?? row['Ref No']),
    invoiceDate: parseDateValue(row.tgl_invoice ?? row['Tgl Invoice']),
    customerName: normalizeText(row.cust_name ?? row['Cust Name']),
    itemNumber: normalizeText(row.item_no ?? row['Item No']),
    itemDescription: normalizeText(row.item_desc ?? row['Item Desc']),
    quantity: parseNumber(row.qty ?? row['Qty']) ?? null,
    price: parseNumber(row.price ?? row['Price']) ?? null,
    grossAmount: parseNumber(row.gross_amt ?? row['Gross Amt']) ?? null,
    discountRate: parseNumber(row.disc_rate ?? row['Disc Rate']) ?? null,
    discountAmount: parseNumber(row.disc_amt ?? row['Disc Amt']) ?? null,
    transactionType: transaction as 'SERVICE' | 'PART' | 'PARTSERVICE' | null,
    dealerName: normalizeText(row.dealer_name ?? row['Dealer Name']),
    noHp: normalizePhone(row.no_hp ?? row['No Hp']),
    engineNumber: normalizeIdentifier(row.nosin ?? row['Nosin']),
    frameNumber: normalizeIdentifier(row.noka ?? row['Noka']),
    groupPart: normalizeGroupPart(row.group_part ?? row['Group Part']),
    raw: { ...row },
  };

  return normalized;
}
