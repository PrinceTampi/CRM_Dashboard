export function DashboardOverview() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Ringkasan operasional CRM. Data penting belum diubah oleh halaman ini.</p>
          </div>
        </header>
        <section className="page-grid" aria-label="Ringkasan dashboard">
          <article className="page-card"><h2>Monitoring</h2><p>Siapkan metrik monitoring di area ini.</p></article>
          <article className="page-card"><h2>Aktivitas</h2><p>Siapkan ringkasan aktivitas pelanggan di area ini.</p></article>
          <article className="page-card"><h2>Status</h2><p>Siapkan indikator status proses CRM di area ini.</p></article>
        </section>
      </div>
    </main>
  );
}
