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
    <main className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section className="card" style={{ width: 'min(100% - 32px, 440px)' }}>
        <div className="page-heading">
          <h1>Masuk CRM</h1>
          <p>Gunakan akun yang diberikan administrator.</p>
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
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><section className="card" style={{ width: 'min(100% - 32px, 440px)' }}><div className="page-heading"><h1>Masuk CRM</h1><p>Memuat form login...</p></div></section></main>}>
      <LoginForm />
    </Suspense>
  );
}
