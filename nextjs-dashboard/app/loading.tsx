export default function Loading() {
  return (
    <main className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <section className="card" style={{ width: 'min(100% - 32px, 360px)', textAlign: 'center' }}>
        <div className="page-heading">
          <h1>Memuat</h1>
          <p>Sedang menyiapkan halaman CRM...</p>
        </div>
        <div aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 600 }}>
          <span className="spinner" style={{ width: '18px', height: '18px', border: '3px solid rgba(11,30,51,0.2)', borderTopColor: '#0B1E33', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          Mohon tunggu
        </div>
      </section>
    </main>
  );
}
