import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
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

export default function NFTDetail() {
  const { collection = '', tokenId = '0' } = useParams();
  const tokenIdNum = parseInt(tokenId, 10);
  const { address: walletAddress } = useAccount();
  const qc = useQueryClient();

  const { data: nft, isLoading } = useNFT(collection, tokenIdNum);
  const { data: listings = [] } = useListings({ collection });
  const { data: activities = [] } = useActivities({ tokenId: tokenIdNum });

  const activeListing = listings.find(
    l => l.tokenId === tokenIdNum &&
         l.collectionAddress.toLowerCase() === collection.toLowerCase() &&
         l.active
  );

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['nfts'] });
    void qc.invalidateQueries({ queryKey: ['listings'] });
  };

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  if (!nft) return <EmptyState message="NFT not found." />;

  const isOwner  = walletAddress?.toLowerCase() === nft.owner.toLowerCase();
  const isSeller = activeListing && walletAddress?.toLowerCase() === activeListing.seller.toLowerCase();

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          <IpfsImage uri={nft.tokenURI} alt={`Token #${nft.tokenId}`} className="rounded-nft aspect-square" />

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

            {activities.length > 0 && (
              <div>
                <h3 className="font-serif text-[24px] text-ivory mb-4">Activity</h3>
                <div className="space-y-3">
                  {activities.slice(0, 6).map(act => (
                    <div key={act.id} className="flex items-center justify-between py-3 border-b border-white/5">
                      <div>
                        <span className="font-sans text-[12px] uppercase tracking-widest text-gold block">{act.type}</span>
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
