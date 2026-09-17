'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'odoc-version';
const APP_VERSION = '1.0.0';

export function AppVersionNotifier() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

    if (!lastSeenVersion) {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      return;
    }

    if (lastSeenVersion !== APP_VERSION) {
      setNotice(`Versi aplikasi diperbarui ke ${APP_VERSION}. Silakan refresh halaman untuk melihat perubahan terbaru.`);
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
  }, []);

  if (!notice) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        zIndex: 9999,
        maxWidth: '360px',
        background: '#0B1E33',
        color: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(11, 30, 51, 0.16)',
        padding: '12px 14px',
        fontSize: '12px',
        lineHeight: 1.5,
      }}
      role="status"
      aria-live="polite"
    >
      <strong style={{ display: 'block', marginBottom: '4px' }}>Update aplikasi</strong>
      <span>{notice}</span>
    </div>
  );
}
