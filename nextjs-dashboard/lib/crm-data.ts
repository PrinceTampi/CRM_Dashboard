import type {
  BirthdayCustomer,
  EventRecord,
  H2Record,
  H3Record,
  H3ActivateRecord,
  BirthdayFuRecord,
  UploadHistoryRecord,
} from './definitions';

import rawBirthdayTuples from './data/birthday-curated.json';
import eventAhassJson from './data/event-ahass.json';
import fuJuliJson from './data/fu-curated.json';
import h3ActivateJson from './data/h3-activate.json';
import h2SampleJson from './data/h2-sample.json';
import h3SampleJson from './data/h3-sample.json';

export const TOTAL_CUSTOMERS_MASTER = 21386;
export const BIRTHDAY_TODAY_COUNT = 71;
export const BIRTHDAY_MONTH_COUNT = 1782;

// Convert raw tuples [name, birth, phone] to typed objects
export const initialBirthdayMaster: BirthdayCustomer[] = (rawBirthdayTuples as [string, string, string][]).map(
  ([name, birth, phone]) => ({ name, birth, phone })
);

export const initialEventAhass: EventRecord[] = eventAhassJson as EventRecord[];
export const initialFuJuli: H2Record[] = fuJuliJson as H2Record[];
export const initialH3Activate: H3ActivateRecord[] = h3ActivateJson as H3ActivateRecord[];

export const initialH2Sample: H2Record[] = (h2SampleJson as [string, string, string, string, string, string, string, string][]).slice(0, 50).map(
  ([name, phone, motor, contact, progress, prospek, next, date]) => ({
    name,
    phone,
    motor,
    contact,
    progress,
    prospek,
    next,
    date,
  })
);

export const initialH3Sample: H3Record[] = (h3SampleJson as [string, string, string, number, number, number, string][]).slice(0, 50).map(
  ([name, phone, part, qty, price, total, date]) => ({
    name,
    phone,
    part,
    qty,
    price,
    total,
    date,
  })
);

export const initialEventData: EventRecord[] = [
  { name: 'JERRY DOWONGI', phone: '081244385308', engine: 'JFU1E1062970', location: 'Pasar Sentral', notes: 'Minat motor sport', date: '2026-08-10' },
  { name: 'NELLA NURMILA TONDAES', phone: '0895355861837', engine: 'JFS1E1055785', location: 'BTN Nusantara', notes: 'Kredit Vario 160', date: '2026-08-11' },
  { name: 'STENLY KAMANGI', phone: '085256280222', engine: 'JFP1E1176207', location: 'Mapanget', notes: 'Servis rutin', date: '2026-08-12' },
  { name: 'JUNAIDI MENDER', phone: '085396838527', engine: 'JFP1E1240187', location: 'Karame', notes: 'Ganti oli + kampas', date: '2026-08-13' },
  { name: 'VALLEN RUMAMBI', phone: '0895612144774', engine: 'JFD2E2447800', location: 'Manado Town Square', notes: 'Tanya promo Scoopy', date: '2026-08-14' },
  { name: 'MELLISA CHRISTINE KAWATAK', phone: '081340127083', engine: 'JFD2E2538035', location: 'Kombos', notes: 'Follow up KPB 2', date: '2026-08-15' },
  { name: 'SILVA MANGUNDAP', phone: '085340127588', engine: 'JFB1E2042104', location: 'Pasar 45', notes: 'Booking service Sabtu', date: '2026-08-16' },
];

export const initialUploadHistory: UploadHistoryRecord[] = [
  { date: '2026-08-15', type: 'H1', month: 'Semua Periode', count: 23491, status: 'Berhasil' },
  { date: '2026-08-11', type: 'H2', month: '2026-08', count: 56460, status: 'Berhasil' },
  { date: '2026-08-08', type: 'H3', month: '2026-08', count: 177473, status: 'Berhasil' },
  { date: '2026-08-05', type: 'BFU', month: '2026-08', count: 8, status: 'Berhasil' },
];

export const initialBirthdayFu: BirthdayFuRecord[] = [
  { name: 'SILVA MANGUNDAP', phone: '085340127588', contact: 'WA Terkirim, Dibalas', deal: 'Deal', date: '2026-08-02' },
  { name: 'OCTAVIA J MUNIR', phone: '082191726745', contact: 'Telp Terhubung', deal: 'Deal', date: '2026-08-03' },
  { name: 'HERLING ROMPIS', phone: '085350327149', contact: 'Telp Terhubung', deal: 'Tidak Deal', date: '2026-08-04' },
  { name: 'ROYKE AUDY PODUNG SEPANG', phone: '085313263318', contact: 'Tidak Terhubung', deal: 'Tidak Deal', date: '2026-08-05' },
  { name: 'ERVANDA Y. RUMBAJAN', phone: '082394903037', contact: 'Telp Terhubung', deal: 'Deal', date: '2026-08-06' },
  { name: 'LITA CHRISTINA TIWOUW', phone: '085298018288', contact: 'WA Terkirim, Dibalas', deal: 'Deal', date: '2026-08-07' },
  { name: 'HENDRIK LUMA', phone: '082114563971', contact: 'Tidak Terhubung', deal: 'Tidak Deal', date: '2026-08-08' },
  { name: 'WAHYUDY KARAENG', phone: '081356666595', contact: 'Telp Terhubung', deal: 'Tidak Deal', date: '2026-08-09' },
];

const monthMap: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseBirthDate(birthStr: string): Date {
  if (!birthStr) return new Date();
  if (birthStr.includes('-')) {
    const parts = birthStr.split('-');
    if (parts.length === 3) {
      if (parts[1].length === 3 && monthMap[parts[1]] !== undefined) {
        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]];
        let year = parseInt(parts[2], 10);
        year += (year > 30 ? 1900 : 2000);
        return new Date(year, month, day);
      }
      return new Date(birthStr);
    }
  }
  return new Date(birthStr);
}

export function calculateAge(birthStr: string): number {
  const birthDate = parseBirthDate(birthStr);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getBirthdayStatus(birthStr: string): 'today' | 'upcoming' | 'passed' {
  const birthDate = parseBirthDate(birthStr);
  const now = new Date();
  const currentYear = now.getFullYear();
  const thisYearBirth = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  const today = new Date(currentYear, now.getMonth(), now.getDate());

  if (thisYearBirth.getTime() === today.getTime()) return 'today';
  if (thisYearBirth.getTime() > today.getTime()) return 'upcoming';
  return 'passed';
}

export function getBirthdaysForMonth(customers: BirthdayCustomer[], monthStr: string): BirthdayCustomer[] {
  const monthIndex = parseInt(monthStr.split('-')[1], 10) - 1;
  return customers.filter((c) => {
    const bd = parseBirthDate(c.birth);
    return bd.getMonth() === monthIndex;
  });
}

export function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normPhone(p: string): string {
  let s = String(p || '').replace(/\D/g, '');
  if (s.startsWith('62')) s = s.slice(2);
  if (s.startsWith('0')) s = s.slice(1);
  return s;
}

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  if (typeof window === 'undefined') return;
  const csvContent = [
    headers.map((h) => `"${String(h).replaceAll('"', '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
