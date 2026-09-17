'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <main className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <section className="card" style={{ width: 'min(100% - 32px, 540px)', textAlign: 'center' }}>
        <div className="page-heading">
          <h1>Terjadi Kesalahan</h1>
          <p>Halaman ini tidak dapat dimuat karena ada masalah tak terduga. Silakan coba lagi atau kembali ke dashboard.</p>
        </div>
        <div className="alert error" style={{ marginBottom: '16px' }}>
          {error.message || 'Ada kesalahan yang tidak diketahui.'}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn-submit" onClick={() => reset()}>
            Coba Lagi
          </button>
          <Link href="/dashboard" className="btn-reset" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            Kembali ke Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
