'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { downloadCsvFile } from '@/lib/crm-data';

export type ModalState = {
  isOpen: boolean;
  title: string;
  body: React.ReactNode;
  onDownloadCsv?: () => void;
};

const ModalContext = createContext<{
  openModal: (title: string, body: React.ReactNode, onDownloadCsv?: () => void) => void;
  closeModal: () => void;
}>({
  openModal: () => {},
  closeModal: () => {},
});

export const useCrmModal = () => useContext(ModalContext);

type NavItem = {
  label: string;
  path: string;
  icon: string;
  altPaths?: string[];
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

const navItems: NavGroup[] = [
  { section: 'Main', items: [
    { label: 'Monitoring', path: '/monitoring', icon: 'fa-chart-line', altPaths: ['/dashboard'] },
  ]},
  { section: 'Customer & AHASS', items: [
    { label: 'Input AHASS', path: '/input-ahass', icon: 'fa-pen-alt' },
    { label: 'Pengecekan R.O', path: '/pengecekan-ro', icon: 'fa-clipboard-check' },
  ]},
  { section: 'Data & Integration', items: [
    { label: 'Upload & Integrasi', path: '/upload', icon: 'fa-upload' },
  ]},
  { section: 'Follow-up & Campaign', items: [
    { label: 'EKSPRES H2', path: '/express-h2', icon: 'fa-flag-checkered' },
    { label: 'SMART BIRTH', path: '/smartbirth', icon: 'fa-bullseye' },
  ]},
  { section: 'Service & Part', items: [
    { label: 'Niguri H3', path: '/niguri-h3', icon: 'fa-chart-simple' },
  ]},
  { section: 'Customer Performance', items: [
    { label: 'Monitoring RCR', path: '/monitoring-rcr', icon: 'fa-rotate' },
  ]},
];

type CrmShellProps = {
  title: string;
  crumb?: string;
  children: React.ReactNode;
};

export function CrmShell({ title, crumb = 'Main', children }: CrmShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    body: null,
  });

  useEffect(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    setCurrentDate(`${dayName}, ${dateNum} ${monthName} ${year}`);
  }, []);

  const openModal = (title: string, body: React.ReactNode, onDownloadCsv?: () => void) => {
    setModal({
      isOpen: true,
      title,
      body,
      onDownloadCsv,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const isItemActive = (path: string, altPaths?: string[]) => {
    if (pathname === path) return true;
    if (altPaths && altPaths.includes(pathname)) return true;
    return false;
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <div id="dashboardPage" className="page-container" style={{ display: 'block' }}>
        <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`} id="appShell">
          <div
            className={`sidebar-backdrop ${mobileNavOpen ? 'show' : ''}`}
            id="sidebarBackdrop"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`} aria-label="Navigasi utama">
            <div className="sidebar-brand">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: '#CC0000',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div className="sidebar-brand-text">
                <strong>One Dashboard One Control</strong>
                <span>CRM · Manado · SULUT</span>
              </div>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((group) => (
                <React.Fragment key={group.section}>
                  <div className="nav-section">{group.section}</div>
                  {group.items.map((item) => {
                    const active = isItemActive(item.path, item.altPaths);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`tab-btn ${active ? 'active' : ''}`}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <i className={`fas ${item.icon}`} aria-hidden="true" />
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))}
            </nav>

            <div className="sidebar-foot">
              <button
                type="button"
                className="collapse-btn"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Ciutkan sidebar"
              >
                <i
                  className={`fas ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`}
                  aria-hidden="true"
                />{' '}
                <span className="nav-label">{collapsed ? 'Lebarkan' : 'Ciutkan'}</span>
              </button>
            </div>
          </aside>

          <div className="main-wrap">
            <header className="dash-header">
              <div className="header-left">
                <button
                  type="button"
                  className="menu-toggle"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  aria-label="Buka menu"
                >
                  <i className="fas fa-bars" />
                </button>
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => router.push('/')}
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali
                </button>
                <div className="title-area">
                  <span className="page-crumb" id="pageCrumb">
                    {crumb}
                  </span>
                  <h1 className="page-title" id="pageTitle">
                    {title}
                  </h1>
                </div>
              </div>
              <div className="date-badge" id="dashDate">
                {currentDate}
              </div>
            </header>

            <div className="dashboard-content">
              {children}
            </div>
          </div>
        </div>
      </div>

      {modal.isOpen && (
        <div
          className="modal-overlay show"
          id="modalOverlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-box">
            <h2>
              <span id="modalTitle">{modal.title}</span>
              {modal.onDownloadCsv && (
                <button
                  type="button"
                  className="btn-download"
                  id="modalDownloadBtn"
                  onClick={modal.onDownloadCsv}
                >
                  <i className="fas fa-download" aria-hidden="true" /> Download CSV
                </button>
              )}
              <button
                type="button"
                className="close-modal"
                onClick={closeModal}
                aria-label="Tutup"
              >
                &times;
              </button>
            </h2>
            <div id="modalBody">{modal.body}</div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
