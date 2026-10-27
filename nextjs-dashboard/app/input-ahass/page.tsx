import { auth } from '@/auth';
import { CustomersPage } from '@/component/input-ahass/customers-page';

export default async function InputAhassPage() {
  const session = await auth();
  return <CustomersPage restrictedAccess={session?.user.role === 'AHASS'} />;
}
