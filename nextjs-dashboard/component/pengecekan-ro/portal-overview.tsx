import Link from 'next/link';

const portalSections = [
  {
    title: 'Dashboard',
    description: 'Ringkasan performa CRM dan indikator utama.',
    href: '/dashboard',
  },
  {
    title: 'Pelanggan',
    description: 'Data pelanggan dan aktivitas yang terkait.',
    href: '/customers',
  },
  {
    title: 'Invoice',
    description: 'Pengelolaan invoice dan status pembayaran.',
    href: '/invoices',
  },
];

export function PortalOverview() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1>CRM Portal</h1>
            <p>Pilih area kerja untuk melanjutkan pengelolaan data CRM.</p>
          </div>
        </header>
        <section className="page-grid" aria-label="Area CRM">
          {portalSections.map((section) => (
            <Link className="page-card" href={section.href} key={section.href}>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
