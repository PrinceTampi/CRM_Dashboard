import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div id="landingPage" className="page-container" style={{ display: 'flex' }}>
      <div className="landing-shell">
        <div className="landing-brand">
          <div
            style={{
              width: '44px',
              height: '44px',
              background: '#FFFFFF',
              color: '#CC0000',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div className="brand-kicker">PT Daya Adicipta Wisesa · Internal CRM</div>
            <div className="brand-title">One Dashboard One Control</div>
          </div>
        </div>
        <p className="landing-intro">
          Platform terpusat untuk monitoring pelanggan, input AHASS, integrasi data H1–H3, follow-up, dan performa operasional dealer.
        </p>
        <div className="choices">
          <div className="choice-card">
            <div className="choice-icon">
              <i className="fas fa-tools" aria-hidden="true" />
            </div>
            <h2>AHASS</h2>
            <p>
              Catat konsumen yang ditemui saat servis atau kegiatan di luar dealer. Data masuk ke registrasi event.
            </p>
            <Link href="/input-ahass" className="btn btn-primary">
              Input <i className="fas fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="choice-card">
            <div className="choice-icon">
              <i className="fas fa-chart-pie" aria-hidden="true" />
            </div>
            <h2>Monitoring CRM</h2>
            <p>
              <span className="badge-dealer">
                <i className="fas fa-chart-line" aria-hidden="true" /> Dashboard
              </span>
            </p>
            <p>
              Masuk ke pusat kendali CRM: monitoring, upload, EKSPRES H2, SMART BIRTH, Niguri H3, dan modul operasional.
            </p>
            <Link href="/dashboard" className="btn btn-outline">
              Masuk Dashboard <i className="fas fa-chevron-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
