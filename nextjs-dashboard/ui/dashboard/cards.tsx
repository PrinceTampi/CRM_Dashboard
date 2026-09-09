import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

import { lusitana } from '@/ui/fonts';
import { invoices, customers } from '@/lib/placeholder-data';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export default function CardWrapper() {
  const totalPaidInvoices = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((total, invoice) => total + invoice.amount, 0);

  const totalPendingInvoices = invoices
    .filter((invoice) => invoice.status === 'pending')
    .reduce((total, invoice) => total + invoice.amount, 0);

  const numberOfInvoices = invoices.length;
  const numberOfCustomers = customers.length;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Collected"
        value={`$${(totalPaidInvoices / 100).toFixed(2)}`}
        type="collected"
      />

      <Card
        title="Pending"
        value={`$${(totalPendingInvoices / 100).toFixed(2)}`}
        type="pending"
      />

      <Card
        title="Total Invoices"
        value={numberOfInvoices}
        type="invoices"
      />

      <Card
        title="Total Customers"
        value={numberOfCustomers}
        type="customers"
      />
    </div>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}

        <h3 className="ml-2 text-sm font-medium">
          {title}
        </h3>
      </div>

      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}