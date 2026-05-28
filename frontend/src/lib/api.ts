const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface Collection {
  address: string;
  owner: string;
  name: string;
  symbol: string;
  metadataURI: string;
  privateMint: boolean;
  createdAt: string;
}

export interface NFT {
  id: string;
  tokenId: number;
  collectionAddress: string;
  owner: string;
  creator: string;
  tokenURI: string;
  royaltyPct: number;
  isListed: boolean;
}

export interface Listing {
  listingId: number;
  collectionAddress: string;
  tokenId: number;
  seller: string;
  price: string;
  active: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  actor: string;
  tokenId: number;
  collectionAddress: string;
  price?: string;
  txHash: string;
  timestamp: string;
}

export const api = {
  collections: {
    list: () => get<Collection[]>('/collections'),
    get: (address: string) => get<Collection>(`/collections/${address}`),
  },
  nfts: {
    list: (params?: { owner?: string; collection?: string }) => {
      const q = new URLSearchParams();
      if (params?.owner) q.set('owner', params.owner);
      if (params?.collection) q.set('collection', params.collection);
      return get<NFT[]>(`/nfts${q.size ? `?${q}` : ''}`);
    },
    get: (collection: string, tokenId: number) =>
      get<NFT>(`/nfts/${collection}/${tokenId}`),
  },
  listings: {
    list: (params?: { minPrice?: string; maxPrice?: string; collection?: string }) => {
      const q = new URLSearchParams();
      if (params?.minPrice) q.set('minPrice', params.minPrice);
      if (params?.maxPrice) q.set('maxPrice', params.maxPrice);
      if (params?.collection) q.set('collection', params.collection);
      return get<Listing[]>(`/listings${q.size ? `?${q}` : ''}`);
    },
  },
  activities: {
    list: (params?: { tokenId?: number; actor?: string }) => {
      const q = new URLSearchParams();
      if (params?.tokenId !== undefined) q.set('tokenId', String(params.tokenId));
      if (params?.actor) q.set('actor', params.actor);
      return get<Activity[]>(`/activities${q.size ? `?${q}` : ''}`);
    },
  },
};
