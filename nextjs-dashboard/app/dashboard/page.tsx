import CardWrapper from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';

import { revenue, invoices, customers } from '@/app/lib/placeholder-data';

export default function Page() {
  const latestInvoices = invoices.slice(0, 5).map((invoice, index) => {
    const customer = customers.find(
      (customer) => customer.id === invoice.customer_id,
    );

    return {
      id: `${index + 1}`,
      amount: `$${(invoice.amount / 100).toFixed(2)}`,
      date: invoice.date,
      status: invoice.status,
      name: customer?.name ?? 'Unknown Customer',
      email: customer?.email ?? '',
      image_url: customer?.image_url ?? '',
    };
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            CRM Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your customers, invoices, and revenue.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <CardWrapper />
        </div>

        {/* Revenue & Latest Invoices */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Revenue */}
          <div className="lg:col-span-3">
            <RevenueChart revenue={revenue} />
          </div>

          {/* Latest Invoices */}
          <div className="lg:col-span-2">
            <LatestInvoices latestInvoices={latestInvoices} />
          </div>
        </div>
      </div>
    </main>
  );
}