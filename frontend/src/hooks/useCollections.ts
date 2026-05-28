import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCollections() {
  return useQuery({ queryKey: ['collections'], queryFn: api.collections.list, staleTime: 30_000 });
}

export function useCollection(address: string) {
  return useQuery({
    queryKey: ['collections', address],
    queryFn: () => api.collections.get(address),
    enabled: !!address,
    staleTime: 30_000,
  });
}
