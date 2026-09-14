'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CrmShell } from '@/component/layout/crm-shell';
import { downloadExcelFile, initialH2Sample } from '@/lib/crm-data';

const months = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26'];
const h1Metrics = ['Total Penjualan Part (Rp)', 'Analysis By', 'Data Filtering', 'SMS/WA Sent', 'Interest (M)', 'Workload from (M-1)', 'Prospect Customer (M-2)', 'Prospect Customer (M-1)', 'Total Data Di Follow Up', 'Contacted by Phone', 'Unreachable', 'Rejected', 'Workload', 'Total Prospect', 'Deal / Konsumen', 'Hot Prospect', 'Low Prospect', 'Not Deal', 'Penjualan Part (Rp)', 'Penjualan Part / Konsumen (Rp)', 'Penjualan Part / Total Penjualan Part (Rp)'];
const dealerOptions = ['AHASS Malalayang', 'AHASS Kombos', 'AHASS Paal Dua'];

function addMonths(date: string, monthsToAdd: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + monthsToAdd);
  return value.toISOString().slice(0, 10);
}

export function NiguriReportView({ initialTab = 'h1' }: { initialTab?: 'h1' | 'h2' | 'h3' }) {
  const [tab, setTab] = useState<'h1' | 'h2' | 'h3'>(initialTab);
  const [dealer, setDealer] = useState(dealerOptions[0]);
  const [dmmsFile, setDmmsFile] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-01-15');
  const h2Rows = useMemo(() => initialH2Sample.slice(0, 12).map((row, index) => ({ ...row, invoiceDate: addMonths(invoiceDate, [2, 4, 8, 12][index % 4]), kpb: `KPB ${(index % 4) + 1}` })), [invoiceDate]);

  const h1Rows = [['Nama Dealer', dealer], ['MONTH', ...months], ['Data Source H2 to H1', 'H1 (HANYA BELI)', 'BELI DAN SERVICE - DEALER SENDIRI', 'HANYA SERVICE - DEALER LAIN'], ...h1Metrics.map((metric, index) => [metric, index === 0 ? 42500000 : index === 1 ? 'Dealer CRM' : index === 2 ? 'H1 / H2 / DMMS' : index % 5 === 0 ? 12 : index % 3 === 0 ? 68 : 0, index === 0 ? 19800000 : index % 4 === 0 ? 8 : 0, index === 0 ? 12700000 : index % 2 === 0 ? 5 : 0])];
  const h2Export = [['BULAN REPORT', invoiceDate], ['DEALER', dealer], ['KPB', 'Tanggal Target', 'Total Data Source', 'Serviced', 'Not Yet Service', 'Contacted', 'Not Contacted', 'Workload', 'Total Visit KPB'], ...h2Rows.map((row) => [row.kpb, row.invoiceDate, row.name, row.contact || 'Belum FU', row.progress || 'Belum Service', row.contact?.includes('Terhubung') ? 1 : 0, row.contact?.includes('Terhubung') ? 0 : 1, row.prospek || 0, row.next || 0])];
  const h3Rows = [['Nama Dealer', dealer], ['YEAR', '2026'], ['MONTH', ...months], ['Metric', 'H1 to H3', 'H2 to H3'], ...['Total Penjualan Part (Rp)', 'SMS/WA Sent', 'Interest (M)', 'Total Prospect', 'Deal / Konsumen', 'Penjualan Part / Konsumen (Rp)'].map((metric, index) => [metric, index === 0 ? 24850000 : index * 12, index === 0 ? 18420000 : index * 9])];
  const downloadReport = () => downloadExcelFile(`Report_Niguri_${dealer.replaceAll(' ', '_')}.xlsx`, [{ name: 'Niguri H1', rows: h1Rows }, { name: 'Niguri H2 KPB', rows: h2Export }, { name: 'Niguri H3', rows: h3Rows }]);

  return <CrmShell title="Report Niguri" crumb="Service & Part">
    <div className="tab-content" style={{ display: 'block' }}>
      <div className="page-heading"><h2>Report Niguri</h2><p>Report H1, H2 KPB, dan H3 dengan format matriks dealer dan export Excel.</p></div>
      <div className="filter-bar"><label htmlFor="niguriDealer">Nama Dealer</label><select id="niguriDealer" value={dealer} onChange={(e) => setDealer(e.target.value)}>{dealerOptions.map((option) => <option key={option}>{option}</option>)}</select><label htmlFor="niguriDmms">Upload DMMS H1</label><input id="niguriDmms" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setDmmsFile(e.target.files?.[0]?.name || '')} /><button type="button" className="btn-download" onClick={downloadReport}><i className="fas fa-file-excel" aria-hidden="true" /> Download Excel Niguri</button></div>
      {dmmsFile && <div className="kpi-hint"><i className="fas fa-check-circle" aria-hidden="true" /> DMMS siap dipakai dalam report H1: {dmmsFile}</div>}
      <div className="filter-bar"><Link href="/niguri/h1" className={`btn-sm ${tab === 'h1' ? 'primary' : ''}`}>Niguri H1</Link><Link href="/niguri/h2" className={`btn-sm ${tab === 'h2' ? 'primary' : ''}`}>Niguri H2 / KPB</Link><Link href="/niguri/h3" className={`btn-sm ${tab === 'h3' ? 'primary' : ''}`}>Niguri H3</Link></div>
      {tab === 'h1' && <div className="card"><h3>Format Niguri H1 <span className="badge info">{dealer}</span></h3><div className="table-wrap"><table className="niguri-table"><tbody>{h1Rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ background: index < 3 ? '#FFF3B0' : undefined, fontWeight: cellIndex === 0 ? 600 : undefined }}>{cell}</td>)}</tr>)}</tbody></table></div></div>}
      {tab === 'h2' && <div className="card"><h3>Format Niguri H2 - KPB berdasarkan tanggal faktur</h3><div className="filter-bar"><label htmlFor="invoiceDate">Tanggal Faktur</label><input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div><div className="stats-grid">{[2, 4, 8, 12].map((month, index) => <Link href={`/niguri/kpb/${index + 1}`} className="stat-card stat-static" key={month}><div className="stat-icon orange"><i className="fas fa-calendar-check" /></div><div className="stat-info"><div className="number">KPB {index + 1}</div><div className="label">H+{month} bulan: {addMonths(invoiceDate, month)}</div></div></Link>)}</div><div className="table-wrap"><table className="niguri-table"><thead><tr><th>KPB</th><th>Tanggal Target</th><th>Nama</th><th>Kontak</th><th>Hasil Service</th></tr></thead><tbody>{h2Rows.map((row, index) => <tr key={index}><td><strong>{row.kpb}</strong></td><td>{row.invoiceDate}</td><td>{row.name}</td><td>{row.contact || 'Belum FU'}</td><td>{row.progress || 'Belum Service'}</td></tr>)}</tbody></table></div></div>}
      {tab === 'h3' && <div className="card"><h3>Format Niguri H3 - Parts dan Conversion</h3><div className="table-wrap"><table className="niguri-table"><tbody>{h3Rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ background: index < 3 ? '#1F2A5A' : index === 0 ? '#FFF3B0' : undefined, color: index < 3 ? '#fff' : undefined, fontWeight: cellIndex === 0 ? 600 : undefined }}>{cell}</td>)}</tr>)}</tbody></table></div></div>}
    </div>
  </CrmShell>;
}
