import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-muted">
      <PackageOpen size={40} className="text-gold/30" />
      <p className="font-sans text-[15px]">{message}</p>
    </div>
  );
}
