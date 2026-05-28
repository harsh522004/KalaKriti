import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { MarketplaceAbi } from '@/lib/abis';
import { MARKETPLACE_ADDRESS } from '@/lib/addresses';

interface Props {
  listingId: number;
  onSuccess?: () => void;
}

export default function CancelButton({ listingId, onSuccess }: Props) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && onSuccess) onSuccess();

  const cancel = () => {
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceAbi,
      functionName: 'cancelListing',
      args: [BigInt(listingId)],
    });
  };

  return (
    <Button variant="secondary" onClick={cancel} disabled={isPending || isConfirming} className="w-full">
      {isPending || isConfirming ? (
        <span className="flex items-center gap-2"><Spinner size={16} /> Cancelling...</span>
      ) : isSuccess ? 'Cancelled' : 'Cancel Listing'}
    </Button>
  );
}
