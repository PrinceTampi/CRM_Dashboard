'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CrmShell, useCrmToast } from '@/component/layout/crm-shell';
import { copySpreadsheetToClipboard, downloadExcelFile } from '@/lib/crm-data';

const months = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26'];
const h1Metrics = ['Total Penjualan Part (Rp)', 'Analysis By', 'Data Filtering', 'SMS/WA Sent', 'Interest (M)', 'Workload from (M-1)', 'Prospect Customer (M-2)', 'Prospect Customer (M-1)', 'Total Data Di Follow Up', 'Contacted by Phone', 'Unreachable', 'Rejected', 'Workload', 'Total Prospect', 'Deal / Konsumen', 'Hot Prospect', 'Low Prospect', 'Not Deal', 'Penjualan Part (Rp)', 'Penjualan Part / Konsumen (Rp)', 'Penjualan Part / Total Penjualan Part (Rp)'];
const dealerOptions = ['AHASS Malalayang', 'AHASS Kombos', 'AHASS Paal Dua'];

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
const h1GroupHeader = (): SpreadsheetCell[] => [value('Data Source H2 to H1', 2, 'section-label'), ...h1SourceGroups.flatMap((group) => [value(group, 4, 'group-title')]), ...h1SourceGroups.flatMap((group) => [value(group, 4, 'group-title')])];
const h1MetricRows = (label: string, cells: SpreadsheetCell[] = []): SpreadsheetCell[] => [value(label, 2, 'row-label'), ...cells, ...Array.from({ length: 24 - cells.reduce((sum, cell) => sum + (cell.colSpan ?? 1), 0) }, () => blank())];

type H1ReportData = {
  totalDataSource: number;
  totalDataAnalysisResult: number;
  totalProspect: number;
  totalCustomerDeal: number;
  totalUnitSold: number;
};

function buildH1Rows(data: H1ReportData): SpreadsheetCell[][] {
  const rows: SpreadsheetCell[][] = [h1Month('Jan-25'), h1GroupHeader()];
  rows.push(h1MetricRows('Total Data Source ', [value(data.totalDataSource, 4)]));
  rows.push(h1MetricRows('Total Data Based On\nAnalysis Result', [value(data.totalDataAnalysisResult, 4)]));
  rows.push(h1MetricRows('Attention by SMS', h1SourceGroups.flatMap(() => [value(0, 2), value(0, 2)]).concat(h1SourceGroups.flatMap(() => [value(0, 2), value(0, 2)]))));
  rows.push(h1MetricRows('', [blank(3), value(0), blank(2), value(0), value(0), blank(3), value(0), blank(3), value(0), blank(3), value(0), blank(2), value(0)]));
  rows.push(h1MetricRows('Workload from (M-1)', [value(0, 4), value(0, 4), value(0, 4), value(0, 4), value(0, 4), value(0, 4)]));
  rows.push(h1MetricRows('total data that must be followed Up by Phone'));
  rows.push(h1MetricRows('Follow up by Call ', h1SourceGroups.flatMap(() => [value('Contacted', 2), value('Not Contacted', 2)]).concat(h1SourceGroups.flatMap(() => [value('Contacted', 2), value('Not Contacted', 2)]))));
  rows.push(h1MetricRows('', h1SourceGroups.flatMap(() => [blank(), value('unreachable'), value('rejected'), value('workload')]).concat(h1SourceGroups.flatMap(() => [blank(), value('unreachable'), value('rejected'), value('workload')]))));
  rows.push(h1MetricRows('Total Prospect', h1SourceGroups.flatMap(() => [value(data.totalProspect), value(0), value(0), value(0)]).concat(h1SourceGroups.flatMap(() => [value(data.totalProspect), value(0), value(0), value(0)]))));
  rows.push(h1MetricRows('Total Customer Result\nFrom Direct Touch', h1SourceGroups.flatMap(() => [value(data.totalCustomerDeal), value(0), value(0), value(Math.max(data.totalProspect - data.totalCustomerDeal, 0))]).concat(h1SourceGroups.flatMap(() => [value(data.totalCustomerDeal), value(0), value(0), value(Math.max(data.totalProspect - data.totalCustomerDeal, 0))]))));
  rows.push(h1MetricRows('Total Unit Sold  Result\nFrom Direct Touch', [value(data.totalUnitSold, 4)]));
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
  const [dealer, setDealer] = useState(dealerOptions[0]);
  const [h1Data, setH1Data] = useState<H1ReportData>({ totalDataSource: 0, totalDataAnalysisResult: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0 });
  const [dmmsFile, setDmmsFile] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-01-15');

  useEffect(() => {
    let active = true;
    fetch(`/api/niguri/h1?dealer=${encodeURIComponent(dealer)}&month=${invoiceDate.slice(0, 7)}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => { if (active) setH1Data(payload); })
      .catch(() => { if (active) setH1Data({ totalDataSource: 0, totalDataAnalysisResult: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0 }); });
    return () => { active = false; };
  }, [dealer, invoiceDate]);

  const h1Rows = [['Nama Dealer', dealer], ['MONTH', ...months], ['Data Source H2 to H1'], ...h1Metrics.map((metric) => [metric, '0'])];
  const h3Rows = [['Nama Dealer', dealer], ['YEAR', 'Belum tersedia'], ['MONTH', ...months], ['Metric', 'H1 to H3', 'H2 to H3'], ...['Total Penjualan Part (Rp)', 'SMS/WA Sent', 'Interest (M)', 'Total Prospect', 'Deal / Konsumen', 'Penjualan Part / Konsumen (Rp)'].map((metric) => [metric, '—', '—'])];
  const h1Clipboard = () => spreadsheetRowsToClipboard(buildH1Rows(h1Data), 26);
  const h3Clipboard = () => spreadsheetRowsToClipboard(buildH3Rows(dealer), 50);
  const downloadReport = () => downloadExcelFile(`Report_Niguri_${dealer.replaceAll(' ', '_')}.xlsx`, [{ name: 'Niguri H1', rows: h1Rows }, { name: 'Niguri H3', rows: h3Rows }]);

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
      <div className="filter-bar"><label htmlFor="niguriDealer">Nama Dealer</label><select id="niguriDealer" value={dealer} onChange={(e) => setDealer(e.target.value)}>{dealerOptions.map((option) => <option key={option}>{option}</option>)}</select><label htmlFor="niguriDmms">Upload DMMS H1</label><input id="niguriDmms" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setDmmsFile(e.target.files?.[0]?.name || '')} /><button type="button" className="btn-download" onClick={downloadReport}><i className="fas fa-file-excel" aria-hidden="true" /> Download Excel Niguri</button></div>
      {dmmsFile && <div className="kpi-hint"><i className="fas fa-check-circle" aria-hidden="true" /> DMMS siap dipakai dalam report H1: {dmmsFile}</div>}
      <div className="filter-bar"><Link href="/niguri/h1" className={`btn-sm ${tab === 'h1' ? 'primary' : ''}`}>Niguri H1</Link><Link href="/niguri/h3" className={`btn-sm ${tab === 'h3' ? 'primary' : ''}`}>Niguri H3</Link></div>
      {tab === 'h1' && <div className="card niguri-format-card"><h3>Format Niguri H1 <span className="badge info">{dealer}</span><button type="button" className="btn-download" onClick={handleCopyH1} style={{ marginLeft: '12px' }}><i className="fas fa-copy" aria-hidden="true" /> Copy Sheet</button></h3><SpreadsheetGrid rows={buildH1Rows(h1Data)} columnCount={26} className="niguri-h1-sheet" /></div>}
      {tab === 'h3' && <div className="card niguri-format-card"><h3>Format Niguri H3 - Parts dan Conversion<button type="button" className="btn-download" onClick={handleCopyH3} style={{ marginLeft: '12px' }}><i className="fas fa-copy" aria-hidden="true" /> Copy Sheet</button></h3><SpreadsheetGrid rows={buildH3Rows(dealer)} columnCount={50} className="niguri-h3-sheet" /></div>}
    </div>
  </CrmShell>;
}
