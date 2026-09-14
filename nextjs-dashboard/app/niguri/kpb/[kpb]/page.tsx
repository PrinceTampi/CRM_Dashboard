import { KpbView } from '@/component/niguri/kpb-view';

export default async function NiguriKpbPage({ params }: { params: Promise<{ kpb: string }> }) {
  const { kpb } = await params;
  const kpbNumber = Number(kpb);
  return <KpbView kpbNumber={kpbNumber >= 1 && kpbNumber <= 4 ? kpbNumber : 1} />;
}