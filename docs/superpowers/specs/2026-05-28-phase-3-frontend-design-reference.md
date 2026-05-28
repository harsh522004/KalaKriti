# KalaKriti Frontend — Design Reference (Dev Use)

> Internal reference for implementing Phase 3 frontend. Derived from `design/DesignBrand.md` and design assets. Do NOT share with user — they have their own brand doc.

---

## Logo Assets

All logo files live in `design/` — copy to `frontend/public/` or import as SVG components.

| File | Usage |
|---|---|
| `design/Horizental.png` | Navbar logo (horizontal: icon + कलाकृति + KalaKriti + NFT MARKETPLACE) |
| `design/Stack.png` | Hero / splash (stacked vertical variant) |
| `design/IconOnly.png` | Favicon, mobile nav, app icon |

Icon anatomy: geometric hexagon (dot at each vertex) → inner diamond → gold brush stroke sweeping right-and-down underneath. The icon is always gold (`#C8A96B`).

Wordmark: "कलाकृति" in Noto Serif Devanagari (gold), "KalaKriti" in Cormorant Garamond (ivory), "NFT MARKETPLACE" in Inter uppercase tracking-widest (muted ivory).

---

## Tailwind Theme (exact tokens)

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // Backgrounds
      bg:        '#0F0F0F',  // main page bg
      surface:   '#161616',  // card bg
      elevated:  '#1A1A1A',  // elevated surface / modals
      hover:     '#202020',  // hover state

      // Brand
      gold:      '#C8A96B',  // primary accent — buttons, prices, highlights
      ivory:     '#F5E9D7',  // primary text
      indigo:    '#1F2A44',  // secondary surfaces / hero bg layer
      bronze:    '#A97142',  // artistic accent
      'gold-deep': '#8B6A3E', // deep premium accent

      // Semantic aliases (useful in components)
      'text-primary':   '#F5E9D7',
      'text-secondary': 'rgba(245,233,215,0.72)',
      'text-muted':     'rgba(245,233,215,0.45)',
    },
    fontFamily: {
      serif:  ['Cormorant Garamond', 'Georgia', 'serif'],      // headings
      sans:   ['Inter', 'system-ui', 'sans-serif'],             // UI
      deva:   ['Noto Serif Devanagari', 'serif'],               // Devanagari
    },
    fontSize: {
      hero:    ['84px', { lineHeight: '1.05', fontWeight: '500' }],
      display: ['48px', { lineHeight: '1.1' }],
      'card-title': ['24px', { lineHeight: '1.3' }],
      body:    ['17px', { lineHeight: '1.7' }],
      label:   ['13px', { lineHeight: '1', letterSpacing: '0.08em' }],
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
      hover:  '250ms',
      page:   '500ms',
      modal:  '350ms',
      hero:   '700ms',
    },
  },
}
```

---

## Typography Rules

- **Hero headings:** Cormorant Garamond, 72–96px, weight 500, line-height 1.05
- **Section titles:** Cormorant Garamond, 40–56px
- **NFT card titles:** Cormorant Garamond, 22–28px
- **Body text:** Inter, 16–18px, line-height 1.7
- **UI labels / buttons:** Inter uppercase, 12–14px, letter-spacing 0.08em
- **Devanagari accents:** Noto Serif Devanagari — hero only, not body
- **Blockchain addresses / hashes:** monospaced (`font-mono`), text-muted

Google Fonts import (in `index.css`):
```
Cormorant+Garamond:wght@400;500;600
Inter:wght@400;500;600
Noto+Serif+Devanagari:wght@400;500
```

---

## Gradient Usage

| Gradient | CSS var | Use on |
|---|---|---|
| Gold | `bg-gradient-gold` | Primary CTA buttons, hero price display |
| Indigo | `bg-gradient-indigo` | Hero section overlay, wallet modal bg |

**Never use** neon glow, bright gradients, or fast animations.

---

## Spacing

Section padding: `py-[120px]`. Page max-width: `max-w-page mx-auto px-6`. Grid: 12-column.

---

## Shadows

Card: `shadow-card` — apply to NFT cards, collection cards.  
Gold glow: `shadow-gold` — apply on hover to price tags and CTA buttons only.

---

## Button Specs

### Primary
```jsx
className="bg-gold text-bg font-sans font-medium uppercase tracking-widest 
           text-label px-8 py-3 rounded-btn hover:brightness-110 
           transition-all duration-hover shadow-gold hover:shadow-gold"
```

### Secondary (outlined)
```jsx
className="border border-gold text-gold font-sans font-medium uppercase 
           tracking-widest text-label px-8 py-3 rounded-btn 
           hover:bg-gold hover:text-bg transition-all duration-hover"
```

---

## NFT Card Spec

```
bg-surface rounded-nft shadow-card overflow-hidden
hover:-translate-y-1 transition-transform duration-hover

Structure:
  [image area]        → aspect-square, object-cover
  [card body]         → p-5
    [title]           → font-serif text-card-title text-ivory
    [collection]      → font-sans text-label text-muted uppercase
    [price row]       → flex justify-between items-center
      [label "Price"] → text-label text-muted
      [amount]        → font-serif text-gold text-lg (gold gradient on hover)
    [action button]   → full-width secondary btn, mt-4
```

---

## Page Navbar

```
bg-bg/95 backdrop-blur border-b border-white/5 sticky top-0 z-50

Left:  Horizontal logo (Horizental.png) — h-10
Center: nav links — font-sans text-label uppercase tracking-widest 
        text-secondary hover:text-gold transition-colors duration-hover
        links: Explore | Collections | Artists | Create | About
Right: search icon + "Connect Wallet" primary button (RainbowKit ConnectButton styled)
```

---

## Hero Section

```
Layout: 2-column split (left text + right NFT showcase)
Background: bg-gradient-indigo overlaid on bg
Padding: py-[160px]

Left col:
  - Small label: "INDIA'S PREMIUM" (text-label uppercase text-gold)
  - H1 in Cormorant Garamond: "Cultural NFT / Marketplace"
  - Devanagari subtitle: "कलाकृति" (font-deva, text-gold, text-display)
  - Body description (Inter, text-secondary)
  - Two CTA buttons: Primary "Explore Artworks" + Secondary "Create NFT"
  - Stats bar: items | artists | ETH volume | collections (font-sans, gold numbers)

Right col:
  - Featured NFT card (elevated, shadow-gold, slight rotation)
  - Floating price badge
```

---

## Page Map

| Route | File | Purpose |
|---|---|---|
| `/` | `pages/Marketplace.tsx` | All active listings, filter/search, hero |
| `/collections` | `pages/Collections.tsx` | All collections grid + Create Collection |
| `/collections/:address` | `pages/CollectionDetail.tsx` | Collection NFTs + metadata |
| `/mint` | `pages/Mint.tsx` | Upload → IPFS → mintNFT |
| `/profile` | `pages/Profile.tsx` | My NFTs, my listings, pending withdrawal |
| `/nft/:collection/:tokenId` | `pages/NFTDetail.tsx` | Detail + List/Buy/Cancel actions |

---

## Wallet UI

RainbowKit theme: dark, accent `#C8A96B`. Override ConnectButton wrapper to match primary button style. Show address in monospace, truncated (6+4 chars). Network guard: if not Sepolia (11155111), show a gold-bordered warning banner.

---

## IPFS Display

All `ipfs://CID` URIs → `https://gateway.pinata.cloud/ipfs/CID` via a `resolveIpfs(uri)` util. Apply to: NFT images, collection metadata images.

---

## Animation Budget

| Trigger | Duration | Easing |
|---|---|---|
| Card hover lift | 250ms | ease |
| Page transition | 500ms | ease-in-out |
| Modal open/close | 350ms | ease-out |
| Hero fade-in | 700ms | ease-out |
| Button hover | 250ms | ease |

Use Framer Motion for page transitions and modal animations. CSS transitions for hover states.

---

## What to NEVER do

- No neon/cyberpunk glow colors
- No bright or loud gradients beyond the two defined above
- No over-animated UI (no bouncing, spinning, pulsing)
- No cartoon or clip-art illustrations
- No heavy Indian ornamentation (no busy mandala borders, etc.)
- No sharp corners (always use border-radius tokens)
- No crowded layouts — breathing space is the design
- No pure gaming aesthetics
