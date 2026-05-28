import { useChainId } from 'wagmi';
import { SEPOLIA_CHAIN_ID } from '@/lib/addresses';

export function useNetworkGuard() {
  const chainId = useChainId();
  return { isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID };
}
