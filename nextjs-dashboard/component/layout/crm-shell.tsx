'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
  { section: 'Admin & Follow-up', items: [
    { label: 'Admin Field', path: '/admin', icon: 'fa-sliders' },
    { label: 'LCR', path: '/lcr', icon: 'fa-filter-circle-dollar' },
  ]},
  { section: 'Data & Integration', items: [
    { label: 'Upload & Integrasi', path: '/upload', icon: 'fa-upload' },
  ]},
  { section: 'Follow-up & Campaign', items: [
    { label: 'EKSPRES H2', path: '/express-h2', icon: 'fa-flag-checkered' },
    { label: 'SMART BIRTH', path: '/smartbirth', icon: 'fa-bullseye' },
  ]},
  { section: 'Service & Part', items: [
    { label: 'Report Niguri', path: '/niguri', icon: 'fa-chart-simple', altPaths: ['/niguri-h3'] },
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

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

const ToastContext = createContext<{
  showToast: (type: ToastType, message: string) => void;
}>({
  showToast: () => {},
});

export const useCrmToast = () => useContext(ToastContext);

function ToastStack({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          <i
            className={`fas ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}
            aria-hidden="true"
          />
          <span>{toast.message}</span>
          <button type="button" onClick={() => onClose(toast.id)} aria-label="Tutup notifikasi">
            <i className="fas fa-xmark" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

function SidebarBrand() {
  return (
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
  );
}

function NavSectionList({
  isItemActive,
  onNavigate,
}: {
  isItemActive: (path: string, altPaths?: string[]) => boolean;
  onNavigate: () => void;
}) {
  return (
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
                onClick={onNavigate}
              >
                <i className={`fas ${item.icon}`} aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );
}

function HeaderBar({
  title,
  currentDate,
  onToggleMenu,
  onBack,
  onLogout,
}: {
  title: string;
  currentDate: string;
  onToggleMenu: () => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="dash-header">
      <div className="header-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={onToggleMenu}
          aria-label="Buka menu"
        >
          <i className="fas fa-bars" />
        </button>
        <button type="button" className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali
        </button>
        <div className="title-area">
          <h1 className="page-title" id="pageTitle">
            {title}
          </h1>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="button" className="btn-reset" onClick={onLogout}>
          <i className="fas fa-right-from-bracket" aria-hidden="true" /> Keluar
        </button>
        <div className="date-badge" id="dashDate">
          {currentDate}
        </div>
      </div>
    </header>
  );
}

function CrmModal({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) {
  if (!modal.isOpen) return null;

  return (
    <div
      className="modal-overlay show"
      id="modalOverlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
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
          <button type="button" className="close-modal" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </h2>
        <div id="modalBody">{modal.body}</div>
      </div>
    </div>
  );
}

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
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, message }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const closeToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const isItemActive = (path: string, altPaths?: string[]) => {
    if (pathname === path) return true;
    if (altPaths && altPaths.includes(pathname)) return true;
    return false;
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <ToastContext.Provider value={{ showToast }}>
      <div id="dashboardPage" className="page-container" style={{ display: 'block' }}>
        <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`} id="appShell">
          <div
            className={`sidebar-backdrop ${mobileNavOpen ? 'show' : ''}`}
            id="sidebarBackdrop"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`} aria-label="Navigasi utama">
            <SidebarBrand />

            <NavSectionList
              isItemActive={isItemActive}
              onNavigate={() => setMobileNavOpen(false)}
            />

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
            <HeaderBar
              title={title}
              currentDate={currentDate}
              onToggleMenu={() => setMobileNavOpen(!mobileNavOpen)}
              onBack={() => router.push('/')}
              onLogout={handleLogout}
            />

            <div className="dashboard-content">
              {children}
            </div>
          </div>
        </div>
      </div>

      <CrmModal modal={modal} onClose={closeModal} />
      <ToastStack toasts={toasts} onClose={closeToast} />
      </ToastContext.Provider>
    </ModalContext.Provider>
  );
}
