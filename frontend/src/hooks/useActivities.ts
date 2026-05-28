import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useActivities(params?: { tokenId?: number; actor?: string }) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => api.activities.list(params),
    staleTime: 15_000,
  });
}
