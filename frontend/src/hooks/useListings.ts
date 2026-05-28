import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useListings(params?: { minPrice?: string; maxPrice?: string; collection?: string }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.listings.list(params),
    staleTime: 15_000,
  });
}
