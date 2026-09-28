export type RcrRow = {
  phone?: string | null;
  noHp?: string | null;
  customerName?: string | null;
  name?: string | null;
  date?: string | null;
  tanggalFaktur?: string | null;
  tglInvoice?: string | null;
  dealer?: string | null;
  kodeDealer?: string | null;
  dealerName?: string | null;
  segment?: string | null;
  customerSegment?: string | null;
  category?: string | null;
  serviceCategory?: string | null;
};

export type RcrMetricSummary = {
  totalCustomer: number;
  repeatCustomer: number;
  rcr: number;
};

export function normalizePhone(value?: string | null): string {
  const raw = String(value ?? '').replace(/[^0-9]/g, '');
  if (!raw) return '';

  if (raw.startsWith('62')) return raw.slice(2);
  if (raw.startsWith('0')) return raw.slice(1);
  return raw;
}

export function computeRcrMetrics(rows: RcrRow[], month: string): RcrMetricSummary {
  const normalizedRows = rows.filter((row) => {
    const sourceDate = row.date ?? row.tanggalFaktur ?? row.tglInvoice ?? '';
    if (!sourceDate) return false;
    return sourceDate.startsWith(month);
  });

  const customers = new Map<string, number>();

  for (const row of normalizedRows) {
    const phone = normalizePhone(row.phone ?? row.noHp ?? row.customerName ?? row.name);
    if (!phone) continue;
    customers.set(phone, (customers.get(phone) ?? 0) + 1);
  }

  const totalCustomer = customers.size;
  const repeatCustomer = Array.from(customers.values()).filter((count) => count > 1).length;

  return {
    totalCustomer,
    repeatCustomer,
    rcr: totalCustomer === 0 ? 0 : (repeatCustomer / totalCustomer) * 100,
  };
}

export function buildRcrDataFromRecords(rows: RcrRow[]) {
  const uniqueMonths = Array.from(
    new Set(
      rows
        .map((row) => row.date ?? row.tanggalFaktur ?? row.tglInvoice ?? '')
        .filter(Boolean)
        .map((value) => value.slice(0, 7))
    ),
  ).sort().slice(-6);

  const dataByMonth: Array<{ period: string; dealer: string; segment: string; category: string; totalCustomer: number; repeatCustomer: number }> = [];

  for (const month of uniqueMonths) {
    const monthRows = rows.filter((row) => {
      const value = row.date ?? row.tanggalFaktur ?? row.tglInvoice ?? '';
      return value.startsWith(month);
    });

    const dealers = new Set<string>(monthRows.map((row) => row.dealer ?? row.dealerName ?? row.kodeDealer ?? 'Dealer Umum').filter(Boolean));
    const segments = new Set<string>(monthRows.map((row) => row.segment ?? row.customerSegment ?? 'Semua').filter(Boolean));
    const categories = new Set<string>(monthRows.map((row) => row.category ?? row.serviceCategory ?? 'Service').filter(Boolean));

    for (const dealer of dealers) {
      for (const segment of segments) {
        for (const category of categories) {
          const filtered = monthRows.filter((row) => {
            const rowDealer = row.dealer ?? row.dealerName ?? row.kodeDealer ?? 'Dealer Umum';
            const rowSegment = row.segment ?? row.customerSegment ?? 'Semua';
            const rowCategory = row.category ?? row.serviceCategory ?? 'Service';
            return rowDealer === dealer && rowSegment === segment && rowCategory === category;
          });

          const customerMap = new Map<string, number>();
          for (const row of filtered) {
            const phone = normalizePhone(row.phone ?? row.noHp ?? '');
            if (!phone) continue;
            customerMap.set(phone, (customerMap.get(phone) ?? 0) + 1);
          }

          const totalCustomer = customerMap.size;
          const repeatCustomer = Array.from(customerMap.values()).filter((count) => count > 1).length;

          dataByMonth.push({
            period: month,
            dealer,
            segment,
            category,
            totalCustomer,
            repeatCustomer,
          });
        }
      }
    }
  }

  return dataByMonth;
}
