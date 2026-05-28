# Phase 3: Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, museum-grade NFT marketplace frontend that embodies KalaKriti's Indian cultural identity — dark matte palette, antique gold accents, Devanagari typography — fully wired to the Sepolia smart contracts and the backend REST API.

**Architecture:** Vite + React + TypeScript SPA. wagmi v2 + viem for all on-chain reads/writes. RainbowKit for wallet modal. TailwindCSS (custom brand tokens) + Framer Motion for animations. shadcn/ui for base components. Pinata SDK for IPFS upload. React Query for backend REST data. React Router v6 for routing.

**Design Reference:** `docs/superpowers/specs/2026-05-28-phase-3-frontend-design-reference.md` — read this before touching any component. All color tokens, font rules, spacing, and animation specs are there.

**Tech Stack:** React 18 + TypeScript 5 (strict), Vite 5, wagmi v2, viem v2, RainbowKit v2, TailwindCSS v3, Framer Motion v11, shadcn/ui, @tanstack/react-query v5, react-router-dom v6, @pinata/sdk (or pinata web3), lucide-react

---

## File Map

```
frontend/
  public/
    logo-horizontal.png       ← copy of design/Horizental.png
    logo-stack.png            ← copy of design/Stack.png
    logo-icon.png             ← copy of design/IconOnly.png
    favicon.ico               ← derived from icon
  src/
    main.tsx                  ← Vite entry, wagmi + RainbowKit + Query providers
    App.tsx                   ← router, layout wrapper
    index.css                 ← Google Fonts import, Tailwind directives, CSS vars
    lib/
      wagmi.config.ts         ← wagmi config (Sepolia, transports)
      abis.ts                 ← re-exports from shared/abis/
      addresses.ts            ← re-exports from shared/addresses.json
      ipfs.ts                 ← resolveIpfs(uri) helper + Pinata upload util
      api.ts                  ← typed fetch wrappers for backend REST endpoints
    hooks/
      useCollections.ts       ← useQuery wrapper for GET /collections
      useNFTs.ts              ← useQuery wrapper for GET /nfts
      useListings.ts          ← useQuery wrapper for GET /listings
      useActivities.ts        ← useQuery wrapper for GET /activities
      useNetworkGuard.ts      ← returns true if connected to Sepolia
    components/
      layout/
        Navbar.tsx            ← sticky nav, logo, links, ConnectButton
        Footer.tsx            ← minimal footer with brand tagline
        NetworkBanner.tsx     ← gold warning if not on Sepolia
        PageWrapper.tsx       ← max-w-page centering + page fade animation
      ui/
        Button.tsx            ← Primary + Secondary variants
        Card.tsx              ← base card surface
        NFTCard.tsx           ← image + title + collection + price + action
        CollectionCard.tsx    ← cover image + name + owner + NFT count
        PriceDisplay.tsx      ← formats wei → ETH with gold styling
        AddressDisplay.tsx    ← truncated monospace address with copy
        StatusBadge.tsx       ← Active / Sold / Cancelled badge
        Spinner.tsx           ← minimal loading indicator
        EmptyState.tsx        ← no-results state with icon
        Modal.tsx             ← Framer Motion animated overlay
        IpfsImage.tsx         ← resolves ipfs:// URIs, shows skeleton while loading
    pages/
      Marketplace.tsx         ← / : hero + listings grid + filter bar
      Collections.tsx         ← /collections : all collections + create CTA
      CollectionDetail.tsx    ← /collections/:address : collection NFTs
      Mint.tsx                ← /mint : upload → IPFS → mintNFT form
      Profile.tsx             ← /profile : my NFTs, my listings, withdraw
      NFTDetail.tsx           ← /nft/:collection/:tokenId : detail + actions
    features/
      mint/
        ImageUpload.tsx       ← drag-and-drop file picker
        MetadataForm.tsx      ← name, description, royalty fields
        MintButton.tsx        ← wagmi useWriteContract for mintNFT
      listing/
        ListingFlow.tsx       ← 2-step: approve → listNFT with step UI
        CancelButton.tsx      ← cancelListing write + optimistic update
      buy/
        BuyButton.tsx         ← buyNFT write with exact price
      withdraw/
        WithdrawPanel.tsx     ← pendingWithdrawals read + withdrawFunds write
  tailwind.config.ts
  vite.config.ts
  tsconfig.json
  .env.example
```

---

## Task 1: Project Scaffold + Brand Tokens

**Files:**
- Create: `frontend/` directory with Vite scaffold
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/src/index.css`
- Create: `frontend/.env.example`
- Copy: logo assets from `design/` to `frontend/public/`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```powershell
cd H:\devlopement\web3\KalaKriti
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install all dependencies**

```powershell
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query react-router-dom framer-motion lucide-react @pinata/sdk
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
npx tailwindcss init -p
```

Then install shadcn/ui:
```powershell
npx shadcn@latest init
```
When prompted: TypeScript → yes, style → Default, base color → Neutral, CSS variables → yes.

- [ ] **Step 3: Create `frontend/tailwind.config.ts`**

Replace the generated config entirely:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0F0F0F',
        'bg-2':      '#121212',
        surface:     '#161616',
        elevated:    '#1A1A1A',
        hover:       '#202020',
        gold:        '#C8A96B',
        ivory:       '#F5E9D7',
        indigo:      '#1F2A44',
        bronze:      '#A97142',
        'gold-deep': '#8B6A3E',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        deva:  ['Noto Serif Devanagari', 'serif'],
        mono:  ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        btn:   '12px',
        card:  '20px',
        modal: '28px',
        input: '14px',
        nft:   '24px',
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.35)',
        gold: '0 0 20px rgba(200,169,107,0.18)',
      },
      backgroundImage: {
        'gradient-gold':   'linear-gradient(135deg, #F5E9D7 0%, #C8A96B 45%, #A97142 100%)',
        'gradient-indigo': 'linear-gradient(180deg, #1F2A44 0%, #0F0F0F 100%)',
      },
      maxWidth: {
        page: '1440px',
      },
      transitionDuration: {
        fast:  '250ms',
        page:  '500ms',
        modal: '350ms',
        hero:  '700ms',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create `frontend/src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&family=Noto+Serif+Devanagari:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background-color: #0F0F0F;
    color: #F5E9D7;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0F0F0F;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0F0F0F; }
  ::-webkit-scrollbar-thumb { background: #C8A96B33; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #C8A96B66; }
}

@layer utilities {
  .text-primary   { color: #F5E9D7; }
  .text-secondary { color: rgba(245,233,215,0.72); }
  .text-muted     { color: rgba(245,233,215,0.45); }
  .text-gold      { color: #C8A96B; }

  .gold-border    { border: 1px solid #C8A96B; }
  .subtle-border  { border: 1px solid rgba(255,255,255,0.06); }
}
```

- [ ] **Step 5: Copy logo assets**

```powershell
Copy-Item ..\design\Horizental.png  .\public\logo-horizontal.png
Copy-Item ..\design\Stack.png       .\public\logo-stack.png
Copy-Item ..\design\IconOnly.png    .\public\logo-icon.png
```

- [ ] **Step 6: Create `frontend/.env.example`**

```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_BACKEND_URL=http://localhost:3001
VITE_PINATA_JWT=your_pinata_jwt_here
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

Copy to `.env` and fill in real values.

- [ ] **Step 7: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 8: Verify dev server runs**

```powershell
npm run dev
```

Expected: Vite dev server starts at http://localhost:5173. Open in browser — should show default Vite React page.

- [ ] **Step 9: Commit**

```powershell
cd ..
git add frontend/
git commit -m "chore(frontend): scaffold Vite React project with brand tokens"
```

---

## Task 2: Wagmi + RainbowKit + React Query Providers

**Files:**
- Create: `frontend/src/lib/wagmi.config.ts`
- Create: `frontend/src/lib/addresses.ts`
- Create: `frontend/src/lib/abis.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create `frontend/src/lib/wagmi.config.ts`**

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const wagmiConfig = getDefaultConfig({
  appName: 'KalaKriti NFT Marketplace',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: { [sepolia.id]: http() },
  ssr: false,
});
```

- [ ] **Step 2: Create `frontend/src/lib/addresses.ts`**

```typescript
import addresses from '../../../shared/addresses.json';

export const FACTORY_ADDRESS  = addresses.sepolia.CollectionFactory as `0x${string}`;
export const MARKETPLACE_ADDRESS = addresses.sepolia.Marketplace as `0x${string}`;
export const SEPOLIA_CHAIN_ID = 11155111;
```

- [ ] **Step 3: Create `frontend/src/lib/abis.ts`**

```typescript
import CollectionFactoryAbi from '../../../shared/abis/CollectionFactory.json';
import NFTCollectionAbi     from '../../../shared/abis/NFTCollection.json';
import MarketplaceAbi       from '../../../shared/abis/Marketplace.json';

export { CollectionFactoryAbi, NFTCollectionAbi, MarketplaceAbi };
```

- [ ] **Step 4: Update `frontend/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { wagmiConfig } from './lib/wagmi.config';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#C8A96B',
            accentColorForeground: '#0F0F0F',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
```

- [ ] **Step 5: Create stub `frontend/src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-gold p-8 font-serif text-display">KalaKriti</div>} />
    </Routes>
  );
}
```

- [ ] **Step 6: Verify compiles and renders**

```powershell
npm run dev
```

Open http://localhost:5173 — should show "KalaKriti" in gold serif font on black background.

- [ ] **Step 7: Commit**

```powershell
cd ..
git add frontend/src/main.tsx frontend/src/App.tsx frontend/src/lib/
git commit -m "feat(frontend): wagmi + RainbowKit + React Query providers"
```

---

## Task 3: API + IPFS Utilities + Data Hooks

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/ipfs.ts`
- Create: `frontend/src/hooks/useCollections.ts`
- Create: `frontend/src/hooks/useNFTs.ts`
- Create: `frontend/src/hooks/useListings.ts`
- Create: `frontend/src/hooks/useActivities.ts`
- Create: `frontend/src/hooks/useNetworkGuard.ts`

- [ ] **Step 1: Create `frontend/src/lib/api.ts`**

```typescript
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
    list: ()                    => get<Collection[]>('/collections'),
    get:  (address: string)     => get<Collection>(`/collections/${address}`),
  },
  nfts: {
    list: (params?: { owner?: string; collection?: string }) => {
      const q = new URLSearchParams();
      if (params?.owner)      q.set('owner', params.owner);
      if (params?.collection) q.set('collection', params.collection);
      return get<NFT[]>(`/nfts${q.size ? `?${q}` : ''}`);
    },
    get: (collection: string, tokenId: number) =>
      get<NFT>(`/nfts/${collection}/${tokenId}`),
  },
  listings: {
    list: (params?: { minPrice?: string; maxPrice?: string; collection?: string }) => {
      const q = new URLSearchParams();
      if (params?.minPrice)   q.set('minPrice', params.minPrice);
      if (params?.maxPrice)   q.set('maxPrice', params.maxPrice);
      if (params?.collection) q.set('collection', params.collection);
      return get<Listing[]>(`/listings${q.size ? `?${q}` : ''}`);
    },
  },
  activities: {
    list: (params?: { tokenId?: number; actor?: string }) => {
      const q = new URLSearchParams();
      if (params?.tokenId !== undefined) q.set('tokenId', String(params.tokenId));
      if (params?.actor)                 q.set('actor', params.actor);
      return get<Activity[]>(`/activities${q.size ? `?${q}` : ''}`);
    },
  },
};
```

- [ ] **Step 2: Create `frontend/src/lib/ipfs.ts`**

```typescript
const GATEWAY = import.meta.env.VITE_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';

export function resolveIpfs(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    return `${GATEWAY}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export async function uploadFileToPinata(file: File): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) throw new Error('Pinata file upload failed');
  const data = await res.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadJsonToPinata(metadata: object): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pinataContent: metadata }),
  });
  if (!res.ok) throw new Error('Pinata JSON upload failed');
  const data = await res.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}
```

- [ ] **Step 3: Create data hooks**

`frontend/src/hooks/useCollections.ts`:
```typescript
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
```

`frontend/src/hooks/useNFTs.ts`:
```typescript
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
```

`frontend/src/hooks/useListings.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useListings(params?: { minPrice?: string; maxPrice?: string; collection?: string }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.listings.list(params),
    staleTime: 15_000,
  });
}
```

`frontend/src/hooks/useActivities.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useActivities(params?: { tokenId?: number; actor?: string }) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => api.activities.list(params),
    staleTime: 15_000,
  });
}
```

`frontend/src/hooks/useNetworkGuard.ts`:
```typescript
import { useChainId } from 'wagmi';
import { SEPOLIA_CHAIN_ID } from '@/lib/addresses';

export function useNetworkGuard() {
  const chainId = useChainId();
  return { isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID };
}
```

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend/src/lib/api.ts frontend/src/lib/ipfs.ts frontend/src/hooks/
git commit -m "feat(frontend): API client, IPFS utils, and data hooks"
```

---

## Task 4: Layout Components (Navbar, Footer, PageWrapper)

**Files:**
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/components/layout/NetworkBanner.tsx`
- Create: `frontend/src/components/layout/Footer.tsx`
- Create: `frontend/src/components/layout/PageWrapper.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Navbar.tsx`**

```tsx
import { Link, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search } from 'lucide-react';

const NAV_LINKS = [
  { to: '/',            label: 'Explore'     },
  { to: '/collections', label: 'Collections' },
  { to: '/mint',        label: 'Create'      },
  { to: '/profile',     label: 'Profile'     },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link to="/" className="flex-shrink-0">
          <img src="/logo-horizontal.png" alt="KalaKriti" className="h-9 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `font-sans text-[13px] uppercase tracking-[0.08em] transition-colors duration-fast ${
                  isActive ? 'text-gold' : 'text-secondary hover:text-ivory'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-muted hover:text-gold transition-colors duration-fast">
            <Search size={18} />
          </button>
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            label="Connect Wallet"
          />
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/layout/NetworkBanner.tsx`**

```tsx
import { useNetworkGuard } from '@/hooks/useNetworkGuard';
import { useAccount } from 'wagmi';
import { AlertTriangle } from 'lucide-react';

export default function NetworkBanner() {
  const { isConnected } = useAccount();
  const { isCorrectNetwork } = useNetworkGuard();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="bg-indigo border-b border-gold/40 px-6 py-3 flex items-center justify-center gap-3">
      <AlertTriangle size={16} className="text-gold flex-shrink-0" />
      <p className="font-sans text-[13px] text-ivory">
        Please switch to <span className="text-gold font-medium">Sepolia Testnet</span> to use KalaKriti.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/layout/Footer.tsx`**

```tsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="max-w-page mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <img src="/logo-horizontal.png" alt="KalaKriti" className="h-8 w-auto opacity-80" />
          <p className="font-sans text-[13px] text-muted text-center md:text-left">
            Own Culture. Own Creativity. Own the Future.
          </p>
        </div>
        <div className="flex items-center gap-8">
          {[['/', 'Explore'], ['/collections', 'Collections'], ['/mint', 'Create']].map(([to, label]) => (
            <Link key={to} to={to} className="font-sans text-[13px] uppercase tracking-[0.08em] text-muted hover:text-gold transition-colors duration-fast">
              {label}
            </Link>
          ))}
        </div>
        <p className="font-sans text-[11px] text-muted">
          Built on Sepolia Testnet · Inspired by Bharat
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/layout/PageWrapper.tsx`**

```tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Update `frontend/src/App.tsx` with layout**

```tsx
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import NetworkBanner from '@/components/layout/NetworkBanner';
import Footer from '@/components/layout/Footer';

// Page stubs — implemented in later tasks
const Marketplace     = () => <div className="p-8 text-gold font-serif text-4xl">Marketplace</div>;
const Collections     = () => <div className="p-8 text-gold font-serif text-4xl">Collections</div>;
const CollectionDetail = () => <div className="p-8 text-gold font-serif text-4xl">Collection Detail</div>;
const Mint            = () => <div className="p-8 text-gold font-serif text-4xl">Mint</div>;
const Profile         = () => <div className="p-8 text-gold font-serif text-4xl">Profile</div>;
const NFTDetail       = () => <div className="p-8 text-gold font-serif text-4xl">NFT Detail</div>;

export default function App() {
  return (
    <div className="bg-bg min-h-screen">
      <Navbar />
      <NetworkBanner />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                              element={<Marketplace />} />
          <Route path="/collections"                   element={<Collections />} />
          <Route path="/collections/:address"          element={<CollectionDetail />} />
          <Route path="/mint"                          element={<Mint />} />
          <Route path="/profile"                       element={<Profile />} />
          <Route path="/nft/:collection/:tokenId"      element={<NFTDetail />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

```powershell
npm run dev
```

Navigate between routes — navbar should be sticky, gold active nav links, network banner visible if wrong chain, footer at bottom.

- [ ] **Step 7: Commit**

```powershell
cd ..
git add frontend/src/components/layout/ frontend/src/App.tsx
git commit -m "feat(frontend): layout components — navbar, footer, network banner"
```

---

## Task 5: Shared UI Components

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/IpfsImage.tsx`
- Create: `frontend/src/components/ui/PriceDisplay.tsx`
- Create: `frontend/src/components/ui/AddressDisplay.tsx`
- Create: `frontend/src/components/ui/NFTCard.tsx`
- Create: `frontend/src/components/ui/CollectionCard.tsx`
- Create: `frontend/src/components/ui/Spinner.tsx`
- Create: `frontend/src/components/ui/EmptyState.tsx`
- Create: `frontend/src/components/ui/Modal.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center font-sans uppercase tracking-[0.08em] rounded-btn transition-all duration-fast disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-gold text-bg font-medium hover:brightness-110 shadow-gold hover:shadow-gold',
    secondary: 'border border-gold text-gold hover:bg-gold hover:text-bg',
  };

  const sizes = {
    sm: 'text-[12px] px-5 py-2',
    md: 'text-[13px] px-8 py-3',
    lg: 'text-[14px] px-10 py-4',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/IpfsImage.tsx`**

```tsx
import { useState } from 'react';
import { resolveIpfs } from '@/lib/ipfs';
import { cn } from '@/lib/utils';

interface Props {
  uri: string;
  alt: string;
  className?: string;
}

export default function IpfsImage({ uri, alt, className }: Props) {
  const [loaded, setLoaded] = useState(false);
  const src = resolveIpfs(uri);

  return (
    <div className={cn('relative bg-elevated overflow-hidden', className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-hover" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn('w-full h-full object-cover transition-opacity duration-modal', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/ui/PriceDisplay.tsx`**

```tsx
interface Props {
  weiAmount: string;
  className?: string;
}

export default function PriceDisplay({ weiAmount, className }: Props) {
  const eth = (Number(BigInt(weiAmount)) / 1e18).toFixed(4).replace(/\.?0+$/, '');
  return (
    <span className={`font-serif text-gold ${className ?? ''}`}>
      {eth} <span className="text-[0.8em] font-sans uppercase tracking-widest text-muted">ETH</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/ui/AddressDisplay.tsx`**

```tsx
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function AddressDisplay({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="inline-flex items-center gap-2 font-mono text-[13px] text-muted hover:text-ivory transition-colors duration-fast group">
      <span>{short}</span>
      {copied
        ? <Check size={12} className="text-gold" />
        : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/ui/NFTCard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { NFT, Listing } from '@/lib/api';
import IpfsImage from './IpfsImage';
import PriceDisplay from './PriceDisplay';
import Button from './Button';

interface Props {
  nft: NFT;
  listing?: Listing;
}

export default function NFTCard({ nft, listing }: Props) {
  return (
    <Link
      to={`/nft/${nft.collectionAddress}/${nft.tokenId}`}
      className="group block bg-surface rounded-nft shadow-card overflow-hidden hover:-translate-y-1 transition-transform duration-fast"
    >
      <IpfsImage uri={nft.tokenURI} alt={`Token #${nft.tokenId}`} className="aspect-square" />
      <div className="p-5 space-y-3">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-muted mb-1">
            Token #{nft.tokenId}
          </p>
          <h3 className="font-serif text-[22px] text-ivory leading-tight line-clamp-1">
            Token #{nft.tokenId}
          </h3>
        </div>
        {listing && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-muted mb-1">Price</p>
              <PriceDisplay weiAmount={listing.price} />
            </div>
            <Button variant="secondary" size="sm" onClick={e => e.preventDefault()}>
              Buy
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 6: Create `frontend/src/components/ui/CollectionCard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Collection } from '@/lib/api';
import IpfsImage from './IpfsImage';
import AddressDisplay from './AddressDisplay';

export default function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      to={`/collections/${collection.address}`}
      className="group block bg-surface rounded-card shadow-card overflow-hidden hover:-translate-y-1 transition-transform duration-fast"
    >
      <IpfsImage uri={collection.metadataURI} alt={collection.name} className="aspect-video" />
      <div className="p-5">
        <h3 className="font-serif text-[24px] text-ivory mb-1 line-clamp-1">{collection.name}</h3>
        <p className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted mb-2">{collection.symbol}</p>
        <AddressDisplay address={collection.owner} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 7: Create remaining small components**

`frontend/src/components/ui/Spinner.tsx`:
```tsx
export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-gold/20 border-t-gold animate-spin"
    />
  );
}
```

`frontend/src/components/ui/EmptyState.tsx`:
```tsx
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-muted">
      <PackageOpen size={40} className="text-gold/30" />
      <p className="font-sans text-[15px]">{message}</p>
    </div>
  );
}
```

`frontend/src/components/ui/Modal.tsx`:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-elevated border border-white/8 rounded-modal p-8 shadow-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-[28px] text-ivory">{title}</h2>
              <button onClick={onClose} className="text-muted hover:text-ivory transition-colors duration-fast">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 8: Verify TypeScript has no errors**

```powershell
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: Commit**

```powershell
cd ..
git add frontend/src/components/ui/
git commit -m "feat(frontend): shared UI components — Button, NFTCard, CollectionCard, Modal"
```

---

## Task 6: Marketplace Page (Hero + Listings Grid)

**Files:**
- Create: `frontend/src/pages/Marketplace.tsx`
- Modify: `frontend/src/App.tsx` (import real page)

- [ ] **Step 1: Create `frontend/src/pages/Marketplace.tsx`**

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import NFTCard from '@/components/ui/NFTCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { useListings } from '@/hooks/useListings';
import { useNFTs } from '@/hooks/useNFTs';

export default function Marketplace() {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: listings = [], isLoading: loadingListings } = useListings({
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  });

  const { data: nfts = [] } = useNFTs();
  const nftMap = Object.fromEntries(nfts.map(n => [`${n.collectionAddress}-${n.tokenId}`, n]));

  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-indigo overflow-hidden">
        <div className="max-w-page mx-auto px-6 py-[140px] grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div>
              <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-4">
                India's Premium
              </p>
              <h1 className="font-deva text-gold text-[48px] font-medium leading-tight mb-2">
                कलाकृति
              </h1>
              <h2 className="font-serif text-[64px] font-medium text-ivory leading-[1.05]">
                Cultural NFT<br />Marketplace
              </h2>
            </div>
            <p className="font-sans text-[17px] text-secondary leading-[1.7] max-w-md">
              Where Indian art, culture and creativity become your digital legacy.
              Own the timeless, trade the extraordinary.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg">Explore Artworks</Button>
              <Link to="/mint">
                <Button variant="secondary" size="lg">Create NFT</Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-10 pt-4 border-t border-white/8">
              {[
                { value: `${listings.length}+`, label: 'Active Listings' },
                { value: `${nfts.length}+`,     label: 'NFTs Minted'    },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="font-serif text-gold text-[32px] font-medium">{value}</p>
                  <p className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: featured card placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="hidden md:flex justify-center"
          >
            <div className="w-72 h-80 bg-surface rounded-nft shadow-gold border border-gold/20 flex items-center justify-center">
              <img src="/logo-stack.png" alt="KalaKriti" className="w-40 opacity-60" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Listings Grid ── */}
      <section className="max-w-page mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Browse</p>
            <h2 className="font-serif text-[40px] text-ivory">Active Listings</h2>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Min ETH (in wei)"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="bg-surface border border-white/10 rounded-input px-4 py-2 font-sans text-[13px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40 w-40"
            />
            <input
              type="text"
              placeholder="Max ETH (in wei)"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="bg-surface border border-white/10 rounded-input px-4 py-2 font-sans text-[13px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40 w-40"
            />
          </div>
        </div>

        {loadingListings ? (
          <div className="flex justify-center py-24"><Spinner size={32} /></div>
        ) : listings.length === 0 ? (
          <EmptyState message="No active listings yet. Be the first to list an NFT." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map(listing => {
              const nft = nftMap[`${listing.collectionAddress}-${listing.tokenId}`];
              return nft ? (
                <NFTCard key={listing.listingId} nft={nft} listing={listing} />
              ) : null;
            })}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
```

- [ ] **Step 2: Wire real page in App.tsx**

Replace the `Marketplace` stub with a real import:
```tsx
import Marketplace from '@/pages/Marketplace';
```

- [ ] **Step 3: Verify in browser**

Start both backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`). Navigate to http://localhost:5173 — hero section should render with Devanagari heading, listings grid shows any indexed listings (may be empty on first run).

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend/src/pages/Marketplace.tsx frontend/src/App.tsx
git commit -m "feat(frontend): marketplace page with hero and listings grid"
```

---

## Task 7: Collections Page + Collection Detail Page

**Files:**
- Create: `frontend/src/pages/Collections.tsx`
- Create: `frontend/src/pages/CollectionDetail.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Collections.tsx`**

```tsx
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import CollectionCard from '@/components/ui/CollectionCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useCollections } from '@/hooks/useCollections';

export default function Collections() {
  const { data: collections = [], isLoading } = useCollections();

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Discover</p>
            <h1 className="font-serif text-[48px] text-ivory">All Collections</h1>
          </div>
          <Link to="/mint">
            <Button>Create Collection</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Spinner size={32} /></div>
        ) : collections.length === 0 ? (
          <EmptyState message="No collections yet. Create the first one." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(col => (
              <CollectionCard key={col.address} collection={col} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/CollectionDetail.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import NFTCard from '@/components/ui/NFTCard';
import IpfsImage from '@/components/ui/IpfsImage';
import AddressDisplay from '@/components/ui/AddressDisplay';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useCollection } from '@/hooks/useCollections';
import { useNFTs } from '@/hooks/useNFTs';
import { useListings } from '@/hooks/useListings';

export default function CollectionDetail() {
  const { address = '' } = useParams();
  const { data: collection, isLoading: loadingCol } = useCollection(address);
  const { data: nfts = [], isLoading: loadingNFTs } = useNFTs({ collection: address });
  const { data: listings = [] } = useListings({ collection: address });
  const listingMap = Object.fromEntries(listings.map(l => [`${l.collectionAddress}-${l.tokenId}`, l]));

  if (loadingCol) return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  if (!collection) return <EmptyState message="Collection not found." />;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="bg-gradient-indigo border-b border-white/5">
        <div className="max-w-page mx-auto px-6 py-16 flex flex-col md:flex-row gap-10 items-start">
          <IpfsImage uri={collection.metadataURI} alt={collection.name} className="w-32 h-32 rounded-card flex-shrink-0" />
          <div className="space-y-3">
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold">{collection.symbol}</p>
            <h1 className="font-serif text-[48px] text-ivory leading-tight">{collection.name}</h1>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[12px] text-muted uppercase tracking-widest">Owner</span>
              <AddressDisplay address={collection.owner} />
            </div>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="font-serif text-gold text-[28px]">{nfts.length}</p>
                <p className="font-sans text-[11px] uppercase tracking-widest text-muted">NFTs</p>
              </div>
              <div>
                <p className="font-serif text-gold text-[28px]">{listings.length}</p>
                <p className="font-sans text-[11px] uppercase tracking-widest text-muted">Listed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFTs grid */}
      <div className="max-w-page mx-auto px-6 py-16">
        <h2 className="font-serif text-[32px] text-ivory mb-8">NFTs in this Collection</h2>
        {loadingNFTs ? (
          <div className="flex justify-center py-16"><Spinner size={32} /></div>
        ) : nfts.length === 0 ? (
          <EmptyState message="No NFTs in this collection yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map(nft => (
              <NFTCard
                key={nft.id}
                nft={nft}
                listing={listingMap[`${nft.collectionAddress}-${nft.tokenId}`]}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
```

- [ ] **Step 3: Wire pages in App.tsx**

```tsx
import Collections     from '@/pages/Collections';
import CollectionDetail from '@/pages/CollectionDetail';
```

- [ ] **Step 4: Verify in browser**

Navigate to `/collections` — grid of collection cards. Click one — detail page with NFT grid.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend/src/pages/Collections.tsx frontend/src/pages/CollectionDetail.tsx frontend/src/App.tsx
git commit -m "feat(frontend): collections page and collection detail page"
```

---

## Task 8: NFT Detail Page + Buy + Cancel + List

**Files:**
- Create: `frontend/src/pages/NFTDetail.tsx`
- Create: `frontend/src/features/listing/ListingFlow.tsx`
- Create: `frontend/src/features/listing/CancelButton.tsx`
- Create: `frontend/src/features/buy/BuyButton.tsx`

- [ ] **Step 1: Create `frontend/src/features/buy/BuyButton.tsx`**

```tsx
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { MarketplaceAbi } from '@/lib/abis';
import { MARKETPLACE_ADDRESS } from '@/lib/addresses';

interface Props {
  listingId: number;
  price: string; // wei string
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
```

- [ ] **Step 2: Create `frontend/src/features/listing/CancelButton.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `frontend/src/features/listing/ListingFlow.tsx`**

Two-step: approve → listNFT. Shows step indicator.

```tsx
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

export default function ListingFlow({ collectionAddress, tokenId, onSuccess }: Props) {
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'listing' | 'done'>('idle');

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
      args: [collectionAddress, BigInt(tokenId), BigInt(parseEther(price))],
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

      {/* Step indicator */}
      {step !== 'idle' && (
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${step === 'approving' ? 'bg-gold animate-pulse' : 'bg-gold'}`} />
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
```

- [ ] **Step 4: Create `frontend/src/pages/NFTDetail.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import PageWrapper from '@/components/layout/PageWrapper';
import IpfsImage from '@/components/ui/IpfsImage';
import PriceDisplay from '@/components/ui/PriceDisplay';
import AddressDisplay from '@/components/ui/AddressDisplay';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import BuyButton from '@/features/buy/BuyButton';
import CancelButton from '@/features/listing/CancelButton';
import ListingFlow from '@/features/listing/ListingFlow';
import { useNFT } from '@/hooks/useNFTs';
import { useListings } from '@/hooks/useListings';
import { useActivities } from '@/hooks/useActivities';
import { useQueryClient } from '@tanstack/react-query';

export default function NFTDetail() {
  const { collection = '', tokenId = '0' } = useParams();
  const tokenIdNum = parseInt(tokenId, 10);
  const { address: walletAddress } = useAccount();
  const qc = useQueryClient();

  const { data: nft, isLoading } = useNFT(collection, tokenIdNum);
  const { data: listings = [] } = useListings({ collection });
  const { data: activities = [] } = useActivities({ tokenId: tokenIdNum });

  const activeListing = listings.find(
    l => l.tokenId === tokenIdNum && l.collectionAddress.toLowerCase() === collection.toLowerCase() && l.active
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['nfts'] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  if (!nft) return <EmptyState message="NFT not found." />;

  const isOwner  = walletAddress?.toLowerCase() === nft.owner.toLowerCase();
  const isSeller = activeListing && walletAddress?.toLowerCase() === activeListing.seller.toLowerCase();

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: image */}
          <IpfsImage uri={nft.tokenURI} alt={`Token #${nft.tokenId}`} className="rounded-nft aspect-square" />

          {/* Right: details */}
          <div className="space-y-8">
            <div>
              <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-3">
                Token #{nft.tokenId}
              </p>
              <h1 className="font-serif text-[48px] text-ivory leading-tight mb-4">
                Token #{nft.tokenId}
              </h1>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[12px] uppercase tracking-widest text-muted w-20">Owner</span>
                  <AddressDisplay address={nft.owner} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[12px] uppercase tracking-widest text-muted w-20">Creator</span>
                  <AddressDisplay address={nft.creator} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[12px] uppercase tracking-widest text-muted w-20">Royalty</span>
                  <span className="font-sans text-[14px] text-secondary">{nft.royaltyPct / 100}%</span>
                </div>
              </div>
            </div>

            {/* Price / Action block */}
            <div className="bg-surface border border-white/8 rounded-card p-6 space-y-5">
              {activeListing ? (
                <>
                  <div>
                    <p className="font-sans text-[12px] uppercase tracking-widest text-muted mb-2">Current Price</p>
                    <PriceDisplay weiAmount={activeListing.price} className="text-[36px]" />
                  </div>
                  {isSeller ? (
                    <CancelButton listingId={activeListing.listingId} onSuccess={invalidate} />
                  ) : (
                    <BuyButton listingId={activeListing.listingId} price={activeListing.price} onSuccess={invalidate} />
                  )}
                </>
              ) : isOwner ? (
                <>
                  <p className="font-sans text-[12px] uppercase tracking-widest text-muted">List for Sale</p>
                  <ListingFlow
                    collectionAddress={collection as `0x${string}`}
                    tokenId={tokenIdNum}
                    onSuccess={invalidate}
                  />
                </>
              ) : (
                <p className="font-sans text-[14px] text-muted">This NFT is not currently listed for sale.</p>
              )}
            </div>

            {/* Activity */}
            {activities.length > 0 && (
              <div>
                <h3 className="font-serif text-[24px] text-ivory mb-4">Activity</h3>
                <div className="space-y-3">
                  {activities.slice(0, 6).map(act => (
                    <div key={act.id} className="flex items-center justify-between py-3 border-b border-white/5">
                      <div>
                        <span className="font-sans text-[12px] uppercase tracking-widest text-gold">{act.type}</span>
                        <AddressDisplay address={act.actor} />
                      </div>
                      {act.price && <PriceDisplay weiAmount={act.price} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
```

- [ ] **Step 5: Wire in App.tsx**

```tsx
import NFTDetail from '@/pages/NFTDetail';
```

- [ ] **Step 6: Test in browser**

Navigate to an NFT detail page. If connected as owner: listing form visible. If listing exists: Buy button visible. If you are the seller: Cancel visible.

- [ ] **Step 7: Commit**

```powershell
cd ..
git add frontend/src/pages/NFTDetail.tsx frontend/src/features/
git commit -m "feat(frontend): NFT detail page with buy, list, and cancel flows"
```

---

## Task 9: Mint Page (Pinata Upload + mintNFT)

**Files:**
- Create: `frontend/src/features/mint/ImageUpload.tsx`
- Create: `frontend/src/features/mint/MetadataForm.tsx`
- Create: `frontend/src/features/mint/MintButton.tsx`
- Create: `frontend/src/pages/Mint.tsx`

- [ ] **Step 1: Create `frontend/src/features/mint/ImageUpload.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  preview?: string;
}

export default function ImageUpload({ onFile, preview }: Props) {
  const [dragging, setDragging] = useState(false);

  const handle = useCallback((file: File) => {
    if (file.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      className={`relative border-2 border-dashed rounded-nft aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors duration-fast ${
        dragging ? 'border-gold bg-gold/5' : 'border-white/20 hover:border-gold/40 bg-surface'
      }`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-nft" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <UploadCloud size={40} className="text-gold/40" />
          <p className="font-sans text-[14px]">Drop image here or click to upload</p>
          <p className="font-sans text-[12px]">PNG, JPG, GIF, WEBP — max 10MB</p>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/Mint.tsx`**

```tsx
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import ImageUpload from '@/features/mint/ImageUpload';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useCollections } from '@/hooks/useCollections';
import { uploadFileToPinata, uploadJsonToPinata } from '@/lib/ipfs';
import { NFTCollectionAbi } from '@/lib/abis';

type Step = 'form' | 'uploading' | 'minting' | 'done';

export default function Mint() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const { data: collections = [] } = useCollections();
  const myCollections = collections.filter(c => c.owner.toLowerCase() === address?.toLowerCase());

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({ name: '', description: '', royalty: '500', collectionAddress: '' });
  const [step, setStep] = useState<Step>('form');
  const [statusMsg, setStatusMsg] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && step === 'minting') setStep('done');

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleMint = async () => {
    if (!file || !form.name || !form.collectionAddress || !address) return;
    try {
      setStep('uploading');
      setStatusMsg('Uploading image to IPFS...');
      const imageUri = await uploadFileToPinata(file);

      setStatusMsg('Uploading metadata to IPFS...');
      const metadataUri = await uploadJsonToPinata({
        name: form.name,
        description: form.description,
        image: imageUri,
      });

      setStep('minting');
      setStatusMsg('Confirm mint transaction in wallet...');
      writeContract({
        address: form.collectionAddress as `0x${string}`,
        abi: NFTCollectionAbi,
        functionName: 'mintNFT',
        args: [metadataUri, address, BigInt(form.royalty)],
      });
    } catch (err) {
      console.error(err);
      setStep('form');
      setStatusMsg('Upload failed. Please try again.');
    }
  };

  if (step === 'done') {
    return (
      <PageWrapper>
        <div className="max-w-page mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
          <img src="/logo-icon.png" alt="KalaKriti" className="w-24 opacity-80" />
          <h2 className="font-serif text-[48px] text-ivory">NFT Minted!</h2>
          <p className="font-sans text-[16px] text-secondary max-w-sm">
            Your NFT has been minted on Sepolia. It will appear in your profile once the indexer processes the block.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/profile')}>View Profile</Button>
            <Button variant="secondary" onClick={() => { setStep('form'); setFile(null); setPreview(''); }}>
              Mint Another
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Create</p>
          <h1 className="font-serif text-[48px] text-ivory">Mint New NFT</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          <ImageUpload onFile={handleFile} preview={preview} />

          <div className="space-y-6">
            {/* Collection select */}
            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">
                Collection *
              </label>
              {myCollections.length === 0 ? (
                <p className="font-sans text-[14px] text-muted">
                  You have no collections. <a href="/collections" className="text-gold underline">Create one first.</a>
                </p>
              ) : (
                <select
                  value={form.collectionAddress}
                  onChange={e => setForm(f => ({ ...f, collectionAddress: e.target.value }))}
                  className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory focus:outline-none focus:border-gold/40"
                >
                  <option value="">Select a collection</option>
                  {myCollections.map(c => (
                    <option key={c.address} value={c.address}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">Name *</label>
              <input
                type="text"
                placeholder="Timeless Grace"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">Description</label>
              <textarea
                rows={4}
                placeholder="Describe your artwork..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40 resize-none"
              />
            </div>

            {/* Royalty */}
            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">
                Royalty (basis points — 500 = 5%)
              </label>
              <input
                type="number"
                min={0} max={1000}
                value={form.royalty}
                onChange={e => setForm(f => ({ ...f, royalty: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory focus:outline-none focus:border-gold/40"
              />
            </div>

            {statusMsg && (
              <p className="font-sans text-[13px] text-gold flex items-center gap-2">
                {(step === 'uploading' || step === 'minting') && <Spinner size={14} />}
                {statusMsg}
              </p>
            )}

            <Button
              onClick={handleMint}
              disabled={!file || !form.name || !form.collectionAddress || step !== 'form' || isPending}
              className="w-full"
              size="lg"
            >
              {step === 'uploading' ? (
                <span className="flex items-center gap-2"><Spinner size={16} /> Uploading...</span>
              ) : step === 'minting' || isPending ? (
                <span className="flex items-center gap-2"><Spinner size={16} /> Minting...</span>
              ) : (
                'Mint NFT'
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
```

- [ ] **Step 3: Wire in App.tsx**

```tsx
import Mint from '@/pages/Mint';
```

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend/src/pages/Mint.tsx frontend/src/features/mint/
git commit -m "feat(frontend): mint page with Pinata IPFS upload and mintNFT"
```

---

## Task 10: Profile Page (My NFTs + My Listings + Withdraw)

**Files:**
- Create: `frontend/src/features/withdraw/WithdrawPanel.tsx`
- Create: `frontend/src/pages/Profile.tsx`

- [ ] **Step 1: Create `frontend/src/features/withdraw/WithdrawPanel.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `frontend/src/pages/Profile.tsx`**

```tsx
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import NFTCard from '@/components/ui/NFTCard';
import AddressDisplay from '@/components/ui/AddressDisplay';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import WithdrawPanel from '@/features/withdraw/WithdrawPanel';
import { useNFTs } from '@/hooks/useNFTs';
import { useListings } from '@/hooks/useListings';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Profile() {
  const { address, isConnected } = useAccount();

  const { data: myNFTs = [], isLoading: loadingNFTs } = useNFTs({ owner: address });
  const { data: allListings = [], isLoading: loadingListings } = useListings();
  const myListings = allListings.filter(l => l.seller.toLowerCase() === address?.toLowerCase());
  const nftMap = Object.fromEntries(myNFTs.map(n => [`${n.collectionAddress}-${n.tokenId}`, n]));

  if (!isConnected) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-40 gap-8">
          <img src="/logo-stack.png" alt="KalaKriti" className="w-32 opacity-60" />
          <h2 className="font-serif text-[40px] text-ivory">Connect Your Wallet</h2>
          <p className="font-sans text-[16px] text-secondary">Connect to view your NFTs and manage your listings.</p>
          <ConnectButton label="Connect Wallet" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16 space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Your Account</p>
            <h1 className="font-serif text-[40px] text-ivory mb-2">Profile</h1>
            {address && <AddressDisplay address={address} />}
          </div>
          <div className="flex gap-3">
            <Link to="/mint"><Button>Mint New NFT</Button></Link>
          </div>
        </div>

        {/* Withdraw */}
        <div className="max-w-sm">
          <WithdrawPanel />
        </div>

        {/* My NFTs */}
        <section>
          <h2 className="font-serif text-[32px] text-ivory mb-8">My NFTs</h2>
          {loadingNFTs ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : myNFTs.length === 0 ? (
            <EmptyState message="You don't own any NFTs yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myNFTs.map(nft => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  listing={allListings.find(l => l.collectionAddress === nft.collectionAddress && l.tokenId === nft.tokenId && l.active)}
                />
              ))}
            </div>
          )}
        </section>

        {/* My Listings */}
        <section>
          <h2 className="font-serif text-[32px] text-ivory mb-8">My Active Listings</h2>
          {loadingListings ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : myListings.length === 0 ? (
            <EmptyState message="You have no active listings." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myListings.map(listing => {
                const nft = nftMap[`${listing.collectionAddress}-${listing.tokenId}`];
                return nft ? <NFTCard key={listing.listingId} nft={nft} listing={listing} /> : null;
              })}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}
```

- [ ] **Step 3: Wire in App.tsx**

```tsx
import Profile from '@/pages/Profile';
```

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend/src/pages/Profile.tsx frontend/src/features/withdraw/
git commit -m "feat(frontend): profile page with my NFTs, listings, and withdraw"
```

---

## Task 11: TypeScript Check + Full Smoke Test

**Files:**
- No new files

- [ ] **Step 1: TypeScript compile check**

```powershell
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Start backend**

In one terminal:
```powershell
cd H:\devlopement\web3\KalaKriti\backend && npm run dev
```

Wait for "Backend running on port 3001".

- [ ] **Step 3: Start frontend**

In another terminal:
```powershell
cd H:\devlopement\web3\KalaKriti\frontend && npm run dev
```

Open http://localhost:5173

- [ ] **Step 4: Smoke test all pages and flows**

Walk through this checklist manually:

**Visual / brand:**
- [ ] Background is matte black `#0F0F0F`
- [ ] Logo renders in navbar (Horizental.png)
- [ ] Font is serif (Cormorant Garamond) for headings, Inter for UI
- [ ] Gold accent color on nav active link, prices, CTAs
- [ ] No neon glow, no sharp corners

**Pages:**
- [ ] `/` — Hero renders with Devanagari heading + English subhead + stats + listing grid
- [ ] `/collections` — Grid of collections (or empty state)
- [ ] `/collections/:address` — Collection header + NFT grid
- [ ] `/mint` — Image uploader + form visible (requires wallet connection)
- [ ] `/profile` — "Connect Wallet" prompt if not connected; NFT grid + withdrawal panel after connect
- [ ] `/nft/:collection/:tokenId` — NFT image + details + action block

**Wallet:**
- [ ] Connect Wallet button opens RainbowKit modal with gold accent
- [ ] Network banner appears if not on Sepolia (chainId ≠ 11155111)
- [ ] Address shows truncated in navbar after connect

**Data:**
- [ ] Listings load from backend (check Network tab — requests to localhost:3001)
- [ ] NFT images load via Pinata gateway

- [ ] **Step 5: Final commit**

```powershell
cd ..
git add frontend/
git commit -m "feat(frontend): Phase 3 complete — KalaKriti UI fully wired"
```

---

## Completion Checklist

- [ ] `npm run dev` — Vite server starts, no console errors
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] Tailwind brand tokens applied (bg black, gold accent, ivory text)
- [ ] Cormorant Garamond + Inter fonts loading from Google Fonts
- [ ] Horizontal logo in navbar
- [ ] RainbowKit gold-accented wallet modal
- [ ] Sepolia network guard banner
- [ ] `/` — hero + listings grid
- [ ] `/collections` — all collections + create CTA
- [ ] `/collections/:address` — collection detail + NFTs
- [ ] `/mint` — image upload + mintNFT with Pinata
- [ ] `/profile` — my NFTs, my listings, pending withdrawal
- [ ] `/nft/:collection/:tokenId` — buy / list / cancel flows
- [ ] Page transitions via Framer Motion

**Next plan:** `2026-05-28-phase-4-polish-deploy.md` (Phase 4 — error handling, Vercel deploy, Railway backend deploy, end-to-end Sepolia test)
