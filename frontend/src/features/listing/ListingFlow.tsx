import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { NFTCollectionAbi, MarketplaceAbi } from '@/lib/abis';
import { MARKETPLACE_ADDRESS } from '@/lib/addresses';

interface Props {
  collectionAddress: `0x${string}`;
  tokenId: number;
  onSuccess?: () => void;
}

type Step = 'idle' | 'approving' | 'listing' | 'done';

export default function ListingFlow({ collectionAddress, tokenId, onSuccess }: Props) {
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<Step>('idle');

  const { writeContract: approve, data: approveHash, isPending: approvePending } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: listNFT, data: listHash, isPending: listPending } = useWriteContract();
  const { isSuccess: listSuccess } = useWaitForTransactionReceipt({ hash: listHash });

  if (listSuccess && step !== 'done') {
    setStep('done');
    onSuccess?.();
  }

  if (approveSuccess && step === 'approving') {
    setStep('listing');
    listNFT({
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceAbi,
      functionName: 'listNFT',
      args: [collectionAddress, BigInt(tokenId), parseEther(price)],
    });
  }

  const startListing = () => {
    if (!price) return;
    setStep('approving');
    approve({
      address: collectionAddress,
      abi: NFTCollectionAbi,
      functionName: 'approve',
      args: [MARKETPLACE_ADDRESS, BigInt(tokenId)],
    });
  };

  if (step === 'done') return <p className="font-sans text-[14px] text-gold">Listed successfully!</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">
          Listing Price (ETH)
        </label>
        <input
          type="number"
          step="0.001"
          placeholder="0.10"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40"
        />
      </div>

      {step === 'approving' && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="font-sans text-[13px] text-secondary">Step 1: Approving marketplace…</span>
        </div>
      )}
      {step === 'listing' && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="font-sans text-[13px] text-secondary">Step 2: Listing NFT…</span>
        </div>
      )}

      <Button
        onClick={startListing}
        disabled={!price || step !== 'idle' || approvePending || listPending}
        className="w-full"
      >
        {approvePending || listPending
          ? <span className="flex items-center gap-2"><Spinner size={16} /> Working…</span>
          : 'List for Sale'}
      </Button>
    </div>
  );
}
