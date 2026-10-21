'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CrmShell, useCrmToast } from '@/component/layout/crm-shell';
import { copySpreadsheetToClipboard, downloadExcelFile } from '@/lib/crm-data';
import { NIGURI_H1_SOURCE_CHANNELS } from '@/lib/import/niguri-h1';

const months = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26'];
const h1Metrics = ['Total Penjualan Part (Rp)', 'Analysis By', 'Data Filtering', 'SMS/WA Sent', 'Interest (M)', 'Workload from (M-1)', 'Prospect Customer (M-2)', 'Prospect Customer (M-1)', 'Total Data Di Follow Up', 'Contacted by Phone', 'Unreachable', 'Rejected', 'Workload', 'Total Prospect', 'Deal / Konsumen', 'Hot Prospect', 'Low Prospect', 'Not Deal', 'Penjualan Part (Rp)', 'Penjualan Part / Konsumen (Rp)', 'Penjualan Part / Total Penjualan Part (Rp)'];

type DealerOption = { id: string; code: string; name: string };
type NiguriImportPreview = {
  dealer: string;
  sourceDealerCodes: string[];
  importedRows: number;
  snapshotCount: number;
  months: Record<string, number>;
  duplicateRows: number;
  invalidRows: number;
  ignoredChannelRows: number;
  ignoredContactStatusRows: number;
};

type SpreadsheetCell = { value?: string | number; colSpan?: number; rowSpan?: number; className?: string; backgroundColor?: string };

function SpreadsheetGrid({ rows, columnCount, className }: { rows: SpreadsheetCell[][]; columnCount: number; className: string }) {
  return <div className="spreadsheet-scroll"><table className={`niguri-spreadsheet ${className}`}><colgroup>{Array.from({ length: columnCount }, (_, index) => <col key={index} />)}</colgroup><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} colSpan={cell.colSpan} rowSpan={cell.rowSpan} className={cell.className} style={cell.backgroundColor ? { backgroundColor: `#${cell.backgroundColor}`, color: ['244061', '366092', '76923C'].includes(cell.backgroundColor) ? '#FFF' : undefined } : undefined}>{cell.value}</td>)}</tr>)}</tbody></table></div>;
}

const blank = (colSpan = 1): SpreadsheetCell => ({ colSpan });
const value = (text: string | number, colSpan = 1, className = ''): SpreadsheetCell => ({ value: text, colSpan, className });

function paintRows(rows: SpreadsheetCell[][], colorAt: (row: number, column: number) => string | undefined): SpreadsheetCell[][] {
  return rows.map((row, rowIndex) => {
    let column = 0;
    return row.map((cell) => {
      const painted = { ...cell, backgroundColor: colorAt(rowIndex, column) };
      column += cell.colSpan ?? 1;
      return painted;
    });
  });
}

function spreadsheetRowsToClipboard(rows: SpreadsheetCell[][], columnCount: number): { headers: string[]; rows: (string | number)[][] } {
  const occupied = new Map<string, string | number>();
  const flattened: (string | number)[][] = [];

  rows.forEach((row, rowIndex) => {
    const values: (string | number)[] = Array.from({ length: columnCount }, () => '');
    let column = 0;
    row.forEach((cell) => {
      while (occupied.has(`${rowIndex}:${column}`)) column += 1;
      const cellValue = cell.value ?? '';
      const colSpan = cell.colSpan ?? 1;
      const rowSpan = cell.rowSpan ?? 1;
      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
          const targetRow = rowIndex + rowOffset;
          const targetColumn = column + columnOffset;
          occupied.set(`${targetRow}:${targetColumn}`, cellValue);
          if (targetRow === rowIndex && targetColumn < columnCount) values[targetColumn] = cellValue;
        }
      }
      column += colSpan;
    });
    flattened[rowIndex] = values.map((cellValue, index) => cellValue || occupied.get(`${rowIndex}:${index}`) || '');
  });

  const [headers = [], ...body] = flattened;
  return { headers: headers.map(String), rows: body };
}

const h1SourceGroups = ['H1 (HANYA BELI)', '(BELI DAN SERVICE - DEALER SENDIRI)', '(HANYA SERVICE - DEALER LAIN)'];
const h1Month = (month: string): SpreadsheetCell[] => [value(month, 14, 'month-title'), value(month, 12, 'month-title')];
const h1GroupHeader = (): SpreadsheetCell[] => [value('Data Source H2 to H1', 2, 'section-label'), ...h1SourceGroups.map((group) => value(group, 8, 'group-title'))];
const h1MetricRows = (label: string, cells: SpreadsheetCell[] = []): SpreadsheetCell[] => [value(label, 2, 'row-label'), ...cells, ...Array.from({ length: 24 - cells.reduce((sum, cell) => sum + (cell.colSpan ?? 1), 0) }, () => blank())];

type H1SourceData = {
  sourceCategory: string;
  totalDataSource: number;
  totalDataAnalysisResult: number;
  totalDataFollowupPhone: number;
  callContacted: number;
  callUnreachable: number;
  callRejected: number;
  callWorkload: number;
  totalProspect: number;
  totalCustomerDeal: number;
  totalUnitSold: number;
  hasSnapshot: boolean;
};

type H1ReportData = {
  totalDataSource: number;
  totalDataAnalysisResult: number;
  totalDataFollowupPhone: number;
  callContacted: number;
  callUnreachable: number;
  callRejected: number;
  callWorkload: number;
  totalProspect: number;
  totalCustomerDeal: number;
  totalUnitSold: number;
  sourceBreakdown: H1SourceData[];
  hasSnapshot: boolean;
};

const EMPTY_H1_DATA: H1ReportData = {
  totalDataSource: 0,
  totalDataAnalysisResult: 0,
  totalDataFollowupPhone: 0,
  callContacted: 0,
  callUnreachable: 0,
  callRejected: 0,
  callWorkload: 0,
  totalProspect: 0,
  totalCustomerDeal: 0,
  totalUnitSold: 0,
  sourceBreakdown: [],
  hasSnapshot: false,
};

function buildH1Rows(data: H1ReportData, monthLabel: string): SpreadsheetCell[][] {
  const sourceValues = (key: keyof Omit<H1SourceData, 'sourceCategory' | 'hasSnapshot'>) => NIGURI_H1_SOURCE_CHANNELS.map((sourceCategory) => {
    const source = data.sourceBreakdown.find((item) => item.sourceCategory === sourceCategory);
    return value(source?.hasSnapshot ? source[key] : data.hasSnapshot ? 0 : '—', 8);
  });
  const unavailableByGroup = NIGURI_H1_SOURCE_CHANNELS.map(() => value('—', 8));
  const contactStatusLabels = NIGURI_H1_SOURCE_CHANNELS.flatMap(() => [
    value('Contacted', 2),
    value('Unreachable', 2),
    value('Rejected', 2),
    value('(Blanks)', 2),
  ]);
  const contactStatusValues = NIGURI_H1_SOURCE_CHANNELS.flatMap((sourceCategory) => {
    const source = data.sourceBreakdown.find((item) => item.sourceCategory === sourceCategory);
    return (['callContacted', 'callUnreachable', 'callRejected', 'callWorkload'] as const).map((key) => (
      value(source?.hasSnapshot ? source[key] : data.hasSnapshot ? 0 : '—', 2)
    ));
  });
  const rows: SpreadsheetCell[][] = [h1Month(monthLabel), h1GroupHeader()];
  rows.push(h1MetricRows('Total Data Source ', sourceValues('totalDataSource')));
  rows.push(h1MetricRows('Total Data Based On\nAnalysis Result', sourceValues('totalDataAnalysisResult')));
  rows.push(h1MetricRows('Attention by SMS', unavailableByGroup));
  rows.push(h1MetricRows('', unavailableByGroup));
  rows.push(h1MetricRows('Workload from (M-1)', unavailableByGroup));
  rows.push(h1MetricRows('total data that must be followed Up by Phone', sourceValues('totalDataFollowupPhone')));
  rows.push(h1MetricRows('Follow up by Call ', contactStatusLabels));
  rows.push(h1MetricRows('', contactStatusValues));
  rows.push(h1MetricRows('Total Prospect', sourceValues('totalProspect')));
  rows.push(h1MetricRows('Total Customer Result\nFrom Direct Touch', sourceValues('totalCustomerDeal')));
  rows.push(h1MetricRows('Total Unit Sold  Result\nFrom Direct Touch', sourceValues('totalUnitSold')));
  rows.push(h1MetricRows('Tracking Data pending'));
  rows.push(h1MetricRows('Contacted by Direct Touch'));
  rows.push(h1MetricRows('Analysis'));
  rows.push(h1MetricRows('Analysis'));
  return paintRows(rows, (row, column) => {
    if ([2, 3, 5].includes(row) && [2, 6, 10, 14, 18, 22].includes(column)) return 'FFFF99';
    if (row === 4 && [3, 7, 11, 15, 19, 23].includes(column)) return 'D99594';
    if (row === 7 && [2, 6, 10, 14, 18, 22].includes(column)) return 'C6D9F0';
    if (row === 9 && [3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21, 23, 24, 25].includes(column)) return column % 4 === 1 ? '244061' : 'D99594';
    if (row === 10 && [2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24].includes(column)) return column % 4 === 2 ? 'C2D69B' : 'C6D9F0';
    if ([11, 15].includes(row) && column >= 2 && column % 4 === 2) return 'FFFF99';
    if ([13, 14].includes(row) && column >= 3 && column % 4 !== 2) return '000000';
    return undefined;
  });
}

function buildH3Rows(dealer: string): SpreadsheetCell[][] {
  const rows: SpreadsheetCell[][] = [[value(`Nama Dealer: ${dealer}`, 2, 'row-label'), value('YEAR'), value('2025', 48, 'year-title')], [blank(), value('MONTH'), ...['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => value(month, 4, 'month-title'))], [blank(), value('Data Source H2 to H1'), ...Array.from({ length: 12 }, () => [value('H1 to H3', 2, 'group-title'), value('H2 to H3', 2, 'group-title')]).flat()]];
  ['Total Penjualan Part (Rp)', 'Analysis By', 'Data Filtering', 'SMS/WA Sent', 'Interest (M)', 'Workload from (M-1)', 'Prospect Customer (M-2)', 'Prospect Customer (M-1)', 'Total Data Di Follow Up', 'Contacted by Phone', 'Unreachable', 'Rejected', 'Workload', 'Total Prospect', 'Deal / Konsumen', 'Hot Prospect', 'Low Prospect', 'Not Deal', 'Penjualan Part (Rp)', 'Penjualan Part / Konsumen (Rp)', 'Penjualan Part / Total Penjualan Part (Rp)'].forEach((metric) => rows.push([blank(), value(metric, 1, 'row-label'), ...Array.from({ length: 48 }, () => blank())]));
  return paintRows(rows, (row, column) => {
    if (row === 0) return '244061';
    if (row === 1) return column === 1 || (column >= 2 && (column - 2) % 4 === 0) ? '244061' : undefined;
    if (row === 2) return column >= 1 ? '244061' : undefined;
    if (row === 3) return column === 1 || (column >= 2 && (column - 2) % 4 === 0) ? 'FFFF99' : undefined;
    if (row === 4) return column >= 1 && (column === 1 || (column - 2) % 2 === 0) ? 'FFFF99' : undefined;
    if ([5, 6, 7, 8, 9, 10, 11].includes(row)) return column >= 1 ? 'FFFF99' : undefined;
    if ([12, 13, 14, 15].includes(row)) return column === 1 || (column >= 2 && (column - 2) % 2 === 0) ? 'FFFF99' : undefined;
    if (row >= 16 && row <= 20) return column === 1 || (column >= 2 && (column - 2) % 2 === 0) ? 'FFFF99' : undefined;
    if (row >= 21) return column >= 1 && column % 2 === 1 ? 'BFBFBF' : undefined;
    return undefined;
  });
}

function addMonths(date: string, monthsToAdd: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + monthsToAdd);
  return value.toISOString().slice(0, 10);
}

export function NiguriReportView({ initialTab = 'h1' }: { initialTab?: 'h1' | 'h2' | 'h3' }) {
  const { showToast } = useCrmToast();
  const [tab, setTab] = useState<'h1' | 'h2' | 'h3'>(initialTab);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [dealer, setDealer] = useState('');
  const [dealersLoading, setDealersLoading] = useState(true);
  const [dealerLoadError, setDealerLoadError] = useState('');
  const [h1Data, setH1Data] = useState<H1ReportData>(EMPTY_H1_DATA);
  const [h1Loading, setH1Loading] = useState(true);
  const [h1LoadError, setH1LoadError] = useState('');
  const [dmmsFile, setDmmsFile] = useState<File | null>(null);
  const [dmmsPreview, setDmmsPreview] = useState<NiguriImportPreview | null>(null);
  const [uploadingDmms, setUploadingDmms] = useState(false);
  const [dmmsMessage, setDmmsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/dealers', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.ok) throw new Error(payload?.message || 'Master dealer gagal dimuat.');
        if (!active) return;
        const rows = (payload.dealers ?? []) as DealerOption[];
        setDealers(rows);
        setDealer((current) => rows.some((item) => item.name === current) ? current : rows[0]?.name ?? '');
      })
      .catch((error) => {
        if (active) setDealerLoadError(error instanceof Error ? error.message : 'Master dealer gagal dimuat.');
      })
      .finally(() => { if (active) setDealersLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setH1Loading(true);
    if (!dealer) {
      setH1Data(EMPTY_H1_DATA);
      setH1LoadError('');
      setH1Loading(false);
      return () => { active = false; };
    }

    fetch(`/api/niguri/h1?dealer=${encodeURIComponent(dealer)}&month=${selectedMonth}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'Data Niguri H1 gagal dimuat.');
        return payload as H1ReportData;
      })
      .then((payload) => {
        if (!active) return;
        setH1Data(payload);
        setH1LoadError('');
      })
      .catch((error) => {
        if (!active) return;
        setH1Data(EMPTY_H1_DATA);
        setH1LoadError(error instanceof Error ? error.message : 'Data Niguri H1 gagal dimuat.');
      })
      .finally(() => { if (active) setH1Loading(false); });
    return () => { active = false; };
  }, [dealer, selectedMonth, refreshKey]);

  const h1MetricFieldByName: Partial<Record<string, keyof Omit<H1SourceData, 'sourceCategory' | 'hasSnapshot'>>> = {
    'Total Data Source': 'totalDataSource',
    'Total Data Based On Analysis Result': 'totalDataAnalysisResult',
    'Total Data Di Follow Up': 'totalDataFollowupPhone',
    'Contacted by Phone': 'callContacted',
    Unreachable: 'callUnreachable',
    Rejected: 'callRejected',
    Workload: 'callWorkload',
    'Total Prospect': 'totalProspect',
    'Deal / Konsumen': 'totalCustomerDeal',
    'Total Unit Sold': 'totalUnitSold',
  };
  const h1Rows = [
    ['Metric', ...h1SourceGroups],
    ...h1Metrics.map((metric) => {
      const field = h1MetricFieldByName[metric];
      return [
        metric,
        ...NIGURI_H1_SOURCE_CHANNELS.map((sourceCategory) => {
          if (!h1Data.hasSnapshot || !field) return '—';
          const source = h1Data.sourceBreakdown.find((item) => item.sourceCategory === sourceCategory);
          return source?.hasSnapshot ? source[field] : 0;
        }),
      ];
    }),
  ];
  const h3Rows = [['Nama Dealer', dealer], ['YEAR', 'Belum tersedia'], ['MONTH', ...months], ['Metric', 'H1 to H3', 'H2 to H3'], ...['Total Penjualan Part (Rp)', 'SMS/WA Sent', 'Interest (M)', 'Total Prospect', 'Deal / Konsumen', 'Penjualan Part / Konsumen (Rp)'].map((metric) => [metric, '—', '—'])];
  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const h1Clipboard = () => spreadsheetRowsToClipboard(buildH1Rows(h1Data, monthLabel), 26);
  const h3Clipboard = () => spreadsheetRowsToClipboard(buildH3Rows(dealer), 50);
  const downloadReport = () => downloadExcelFile(`Report_Niguri_${dealer.replaceAll(' ', '_')}.xlsx`, [{ name: 'Niguri H1', rows: h1Rows }, { name: 'Niguri H3', rows: h3Rows }]);

  const handleDmmsUpload = async () => {
    if (!dmmsFile) {
      showToast('warning', 'Pilih file DMMS terlebih dahulu.');
      return;
    }
    setUploadingDmms(true);
    setDmmsMessage(null);
    const formData = new FormData();
    formData.append('file', dmmsFile);
    formData.append('dealer', dealer);
    formData.append('month', selectedMonth);
    formData.append('action', dmmsPreview ? 'confirm' : 'preview');

    try {
      const response = await fetch('/api/niguri/h1', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.message || 'Upload DMMS gagal diproses.');
      if (payload.previewOnly) {
        setDmmsPreview(payload as NiguriImportPreview);
        const sourceCodes = payload.sourceDealerCodes?.join(', ') || 'tidak dicantumkan';
        const months = Object.keys(payload.months ?? {}).sort().join(', ') || 'tidak ada';
        setDmmsMessage({
          type: 'success',
          text: `Preview ${payload.importedRows} prospek untuk ${dealer}; bulan: ${months}; kode dealer di file: ${sourceCodes}. Pastikan pemetaan dealer benar sebelum konfirmasi. Duplikat: ${payload.duplicateRows}; channel di luar filter: ${payload.ignoredChannelRows}; Contact Status di luar filter: ${payload.ignoredContactStatusRows}; baris tidak valid: ${payload.invalidRows}.`,
        });
        return;
      }
      const importDetails = payload.months
        ? ` Bulan dalam file: ${Object.keys(payload.months).sort().join(', ') || 'tidak ada'}; kode dealer sumber: ${payload.sourceDealerCodes?.join(', ') || 'tidak dicantumkan'} dipetakan ke ${dealer}. Baris duplikat: ${payload.duplicateRows ?? 0}; channel di luar filter: ${payload.ignoredChannelRows ?? 0}; Contact Status di luar filter: ${payload.ignoredContactStatusRows ?? 0}; tidak valid: ${payload.invalidRows ?? 0}.`
        : ` Dealer: ${dealer}; bulan: ${selectedMonth}.`;
      const message = `${payload.message}${importDetails}`;
      setDmmsMessage({ type: 'success', text: message });
      setDmmsFile(null);
      setDmmsPreview(null);
      setRefreshKey((current) => current + 1);
      showToast('success', message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload DMMS gagal diproses.';
      setDmmsMessage({ type: 'error', text: message });
      showToast('error', message);
    } finally {
      setUploadingDmms(false);
    }
  };

  const copySheetRows = async (headers: string[], rows: (string | number)[][]) => {
    try {
      await copySpreadsheetToClipboard(headers, rows);
      showToast('success', 'Data berhasil disalin. Silakan paste ke spreadsheet.');
    } catch {
      showToast('error', 'Data gagal disalin ke clipboard.');
    }
  };

  const handleCopyH1 = () => {
    const clipboard = h1Clipboard();
    void copySheetRows(clipboard.headers, clipboard.rows);
  };

  const handleCopyH3 = () => {
    const clipboard = h3Clipboard();
    void copySheetRows(clipboard.headers, clipboard.rows);
  };

  return <CrmShell title="Report Niguri" crumb="Service & Part">
    <div className="tab-content" style={{ display: 'block' }}>
      <div className="page-heading"><h2>Report Niguri</h2><p>Report H1 dan H3 dengan format matriks dealer dan export Excel.</p></div>
      <div className="filter-bar">
        <label htmlFor="niguriDealer">Nama Dealer</label>
        <select id="niguriDealer" value={dealer} onChange={(e) => { setDealer(e.target.value); setDmmsPreview(null); }} disabled={dealersLoading || dealers.length === 0}>
          {dealers.length === 0 && <option value="">{dealersLoading ? 'Memuat master dealer...' : 'Belum ada dealer di master'}</option>}
          {dealers.map((option) => <option key={option.id} value={option.name}>{option.name} ({option.code})</option>)}
        </select>
        <label htmlFor="niguriMonth">Bulan Data</label>
        <input id="niguriMonth" type="month" value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setDmmsPreview(null); }} />
        <label htmlFor="niguriDmms">Upload DataProspek / DMMS H1</label>
        <input id="niguriDmms" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { setDmmsFile(e.target.files?.[0] ?? null); setDmmsPreview(null); }} />
        <button type="button" className="btn-sm primary" onClick={handleDmmsUpload} disabled={!dmmsFile || !dealer || uploadingDmms}>
          <i className={`fas ${uploadingDmms ? 'fa-spinner fa-spin' : dmmsPreview ? 'fa-check' : 'fa-upload'}`} aria-hidden="true" /> {uploadingDmms ? 'Memproses...' : dmmsPreview ? 'Konfirmasi Impor' : 'Preview / Upload'}
        </button>
        <button type="button" className="btn-download" onClick={downloadReport}><i className="fas fa-file-excel" aria-hidden="true" /> Download Excel Niguri</button>
      </div>
      {dealerLoadError && <div className="kpi-hint danger" role="alert">{dealerLoadError}</div>}
      {h1LoadError && <div className="kpi-hint danger" role="alert">{h1LoadError}</div>}
      {dmmsPreview && <div className="kpi-hint" role="status">Kode dealer sumber {dmmsPreview.sourceDealerCodes.join(', ') || '(tidak ada)'} akan dipetakan ke dealer {dealer}. Pastikan ini pemetaan yang benar sebelum klik Konfirmasi Impor.</div>}
      {!dealersLoading && dealers.length === 0 && !dealerLoadError && <div className="kpi-hint" role="status">Belum ada dealer di master. Minta Admin menambahkan kode dan nama resmi dealer terlebih dahulu.</div>}
      {dmmsFile && <div className="kpi-hint"><i className="fas fa-file-excel" aria-hidden="true" /> File dipilih: {dmmsFile.name}</div>}
      {dmmsMessage && <div className={`kpi-hint ${dmmsMessage.type === 'error' ? 'danger' : ''}`} role={dmmsMessage.type === 'error' ? 'alert' : 'status'}>{dmmsMessage.text}</div>}
      {tab === 'h1' && <div className="kpi-hint" role="status">{h1Loading ? 'Memuat snapshot Niguri H1...' : h1Data.hasSnapshot ? `Snapshot Niguri H1 tersedia untuk ${dealer} periode ${selectedMonth}. Nilai dikelompokkan berdasarkan Channel Penjualan.` : `Belum ada snapshot Niguri H1 untuk ${dealer} periode ${selectedMonth}.`}</div>}
      {tab === 'h1' && <div className="kpi-hint">Channel H1: {NIGURI_H1_SOURCE_CHANNELS.join(', ')}. Contact Status yang dihitung: kosong, Contacted, Rejected, dan Unreachable. Deal/unit hanya menghitung Status Deal SPK Indent dan Deal SPK Non Indent.</div>}
      <div className="filter-bar"><Link href="/niguri/h1" className={`btn-sm ${tab === 'h1' ? 'primary' : ''}`}>Niguri H1</Link><Link href="/niguri/h3" className={`btn-sm ${tab === 'h3' ? 'primary' : ''}`}>Niguri H3</Link></div>
      {tab === 'h1' && <div className="card niguri-format-card"><h3>Format Niguri H1 <span className="badge info">{dealer}</span><button type="button" className="btn-download" onClick={handleCopyH1} style={{ marginLeft: '12px' }}><i className="fas fa-copy" aria-hidden="true" /> Copy Sheet</button></h3><SpreadsheetGrid rows={buildH1Rows(h1Data, monthLabel)} columnCount={26} className="niguri-h1-sheet" /></div>}
      {tab === 'h3' && <div className="card niguri-format-card"><h3>Format Niguri H3 - Parts dan Conversion<button type="button" className="btn-download" onClick={handleCopyH3} style={{ marginLeft: '12px' }}><i className="fas fa-copy" aria-hidden="true" /> Copy Sheet</button></h3><SpreadsheetGrid rows={buildH3Rows(dealer)} columnCount={50} className="niguri-h3-sheet" /></div>}
    </div>
  </CrmShell>;
}
