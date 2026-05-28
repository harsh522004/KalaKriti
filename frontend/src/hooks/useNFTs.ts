import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useNFTs(params?: { owner?: string; collection?: string }) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => api.nfts.list(params),
    staleTime: 30_000,
  });
}

export function useNFT(collection: string, tokenId: number) {
  return useQuery({
    queryKey: ['nfts', collection, tokenId],
    queryFn: () => api.nfts.get(collection, tokenId),
    enabled: !!collection && tokenId >= 0,
    staleTime: 30_000,
  });
}
