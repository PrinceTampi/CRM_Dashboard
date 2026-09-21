'use client';

import { FormEvent, Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function getSafeRedirect(target: string | null): string {
  if (!target || !target.startsWith('/')) {
    return '/dashboard';
  }

  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return '/dashboard';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/dashboard';
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password tidak valid. Silakan cek kembali data login Anda.');
        return;
      }

      if (!result?.ok) {
        setError('Login gagal. Periksa koneksi Anda atau coba beberapa saat lagi.');
        return;
      }

      const target = getSafeRedirect(searchParams.get('callbackUrl'));
      router.replace(target);
      router.refresh();
    } catch (submitError) {
      console.error('Login submit error:', submitError);
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-brand-panel">
          <div className="login-brand-mark"><i className="fas fa-chart-line" aria-hidden="true" /></div>
          <span className="login-eyebrow">One Dashboard One Control</span>
          <h1>Operasional CRM dalam satu kendali.</h1>
          <p>Kelola pelanggan, penjualan, follow-up, dan performa dealer dengan data yang terhubung.</p>
          <div className="login-trust-list">
            <span><i className="fas fa-check-circle" aria-hidden="true" /> Data operasional terpusat</span>
            <span><i className="fas fa-check-circle" aria-hidden="true" /> Akses berbasis peran</span>
            <span><i className="fas fa-check-circle" aria-hidden="true" /> Monitoring yang siap digunakan</span>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-form-kicker">Portal perusahaan</span>
            <h2>Selamat datang kembali</h2>
            <p>Masuk menggunakan akun yang diberikan administrator.</p>
          </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          </div>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="btn-submit" disabled={loading}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-arrow-right'}`} aria-hidden="true" />
            {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>
        </form>
          <div className="login-form-footer"><i className="fas fa-shield-alt" aria-hidden="true" /> Akses aman untuk pengguna terdaftar</div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page"><section className="login-shell"><div className="login-form-panel"><div className="login-form-heading"><span className="login-form-kicker">Portal perusahaan</span><h2>Memuat login...</h2></div></div></section></main>}>
      <LoginForm />
    </Suspense>
  );
}
