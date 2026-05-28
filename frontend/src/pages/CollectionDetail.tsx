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
