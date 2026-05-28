import { Link } from 'react-router-dom';
import { type NFT, type Listing } from '@/lib/api';
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
