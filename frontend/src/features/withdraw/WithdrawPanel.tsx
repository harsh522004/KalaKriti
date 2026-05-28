import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Button from '@/components/ui/Button';
import PriceDisplay from '@/components/ui/PriceDisplay';
import Spinner from '@/components/ui/Spinner';
import { MarketplaceAbi } from '@/lib/abis';
import { MARKETPLACE_ADDRESS } from '@/lib/addresses';

export default function WithdrawPanel() {
  const { address } = useAccount();

  const { data: pending = 0n } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceAbi,
    functionName: 'pendingWithdrawals',
    args: [address!],
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = () => {
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceAbi,
      functionName: 'withdrawFunds',
    });
  };

  const hasFunds = (pending as bigint) > 0n;

  return (
    <div className="bg-surface border border-white/8 rounded-card p-6 space-y-4">
      <h3 className="font-serif text-[24px] text-ivory">Pending Earnings</h3>
      <div>
        <p className="font-sans text-[12px] uppercase tracking-widest text-muted mb-1">Available to Withdraw</p>
        {hasFunds ? (
          <PriceDisplay weiAmount={String(pending)} className="text-[32px]" />
        ) : (
          <p className="font-sans text-[14px] text-muted">No pending earnings.</p>
        )}
      </div>
      {hasFunds && (
        <Button onClick={withdraw} disabled={isPending || isConfirming || isSuccess} className="w-full">
          {isPending || isConfirming
            ? <span className="flex items-center gap-2"><Spinner size={16} /> Withdrawing...</span>
            : isSuccess ? 'Withdrawn!' : 'Withdraw ETH'}
        </Button>
      )}
    </div>
  );
}
