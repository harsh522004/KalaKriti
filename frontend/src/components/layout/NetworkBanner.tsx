import { useNetworkGuard } from '@/hooks/useNetworkGuard';
import { useAccount } from 'wagmi';
import { AlertTriangle } from 'lucide-react';

export default function NetworkBanner() {
  const { isConnected } = useAccount();
  const { isCorrectNetwork } = useNetworkGuard();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="bg-indigo border-b border-gold/40 px-6 py-3 flex items-center justify-center gap-3">
      <AlertTriangle size={16} className="text-gold flex-shrink-0" />
      <p className="font-sans text-[13px] text-ivory">
        Please switch to <span className="text-gold font-medium">Sepolia Testnet</span> to use KalaKriti.
      </p>
    </div>
  );
}
