import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <section className="card" style={{ width: 'min(100% - 32px, 480px)', textAlign: 'center' }}>
        <div className="page-heading">
          <h1>Halaman Tidak Ditemukan</h1>
          <p>URL yang Anda tuju mungkin sudah tidak tersedia atau dialihkan.</p>
        </div>
        <Link href="/dashboard" className="btn-submit" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
