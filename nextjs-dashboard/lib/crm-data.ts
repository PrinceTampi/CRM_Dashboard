import type {
  BirthdayCustomer,
  EventRecord,
  H2Record,
  H3Record,
  H3ActivateRecord,
  BirthdayFuRecord,
  UploadHistoryRecord,
  RepairOrderRecord,
  LcrRecord,
} from './definitions';
import * as XLSX from 'xlsx';

export const TOTAL_CUSTOMERS_MASTER = 0;
export const BIRTHDAY_TODAY_COUNT = 0;
export const BIRTHDAY_MONTH_COUNT = 0;

const placeholderCustomer = { name: 'Lorem ipsum customer', birth: '01-Jan-00', phone: '0000000000' };

export const initialBirthdayMaster: BirthdayCustomer[] = [placeholderCustomer];
export const initialEventAhass: EventRecord[] = [{ name: 'Lorem ipsum event', phone: '0000000000', engine: 'PLACEHOLDER', date: '1970-01-01', status: 'PLACEHOLDER' }];
export const initialFuJuli: H2Record[] = [{ name: 'Lorem ipsum follow up', phone: '0000000000', motor: 'Lorem ipsum', contact: 'Belum tersedia', progress: 'Belum tersedia', date: '1970-01-01' }];
export const initialH3Activate: H3ActivateRecord[] = [{ name: 'Lorem ipsum activation', phone: '0000000000', contact: 'Belum tersedia', date: '1970-01-01' }];
export const initialH2Sample: H2Record[] = [initialFuJuli[0]];
export const initialH3Sample: H3Record[] = [{ name: 'Lorem ipsum part', phone: '0000000000', part: 'Lorem ipsum', qty: 0, price: 0, total: 0, date: '1970-01-01' }];
export const initialEventData: EventRecord[] = [{ name: 'Lorem ipsum event', phone: '0000000000', engine: 'PLACEHOLDER', location: 'Lorem ipsum', notes: 'Lorem ipsum', date: '1970-01-01' }];
export const initialUploadHistory: UploadHistoryRecord[] = [];
export const initialBirthdayFu: BirthdayFuRecord[] = [{ name: 'Lorem ipsum follow up', phone: '0000000000', contact: 'Belum tersedia', deal: 'Belum tersedia', date: '1970-01-01' }];
export const initialRepairOrders: RepairOrderRecord[] = [{ no: 1, customer: 'Lorem ipsum customer', phone: '0000000000', nik: 'PLACEHOLDER', engine: 'PLACEHOLDER', roNumber: 'PLACEHOLDER', ahass: 'Lorem ipsum AHASS', date: '1970-01-01', job: 'Lorem ipsum', status: 'Belum Dicek', cost: 0 }];
export const initialLcrData: LcrRecord[] = [{ name: 'Lorem ipsum customer', phone: '0000000000', nik: 'PLACEHOLDER', motor: 'Lorem ipsum', district: 'Lorem ipsum', status: 'Belum tersedia', contact: 'Belum tersedia', result: 'Belum tersedia', date: '1970-01-01' }];

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

export function downloadExcelFile(
  filename: string,
  sheets: { name: string; rows: (string | number)[][] }[]
) {
  if (typeof window === 'undefined') return;
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  });
  XLSX.writeFile(workbook, filename);
}
