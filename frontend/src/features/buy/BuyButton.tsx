import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { MarketplaceAbi } from '@/lib/abis';
import { MARKETPLACE_ADDRESS } from '@/lib/addresses';

interface Props {
  listingId: number;
  price: string;
  onSuccess?: () => void;
}

export default function BuyButton({ listingId, price, onSuccess }: Props) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && onSuccess) onSuccess();

  const buy = () => {
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceAbi,
      functionName: 'buyNFT',
      args: [BigInt(listingId)],
      value: BigInt(price),
    });
  };

  return (
    <Button onClick={buy} disabled={isPending || isConfirming} className="w-full">
      {isPending || isConfirming ? (
        <span className="flex items-center gap-2"><Spinner size={16} /> Confirming...</span>
      ) : isSuccess ? (
        'Purchased!'
      ) : (
        'Buy Now'
      )}
    </Button>
  );
}
