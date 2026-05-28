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
      {/* Hero */}
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

      {/* Listings Grid */}
      <section className="max-w-page mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Browse</p>
            <h2 className="font-serif text-[40px] text-ivory">Active Listings</h2>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Min price (wei)"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="bg-surface border border-white/10 rounded-input px-4 py-2 font-sans text-[13px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40 w-40"
            />
            <input
              type="text"
              placeholder="Max price (wei)"
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
