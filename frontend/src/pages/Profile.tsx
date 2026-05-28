import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PageWrapper from '@/components/layout/PageWrapper';
import NFTCard from '@/components/ui/NFTCard';
import AddressDisplay from '@/components/ui/AddressDisplay';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import WithdrawPanel from '@/features/withdraw/WithdrawPanel';
import { useNFTs } from '@/hooks/useNFTs';
import { useListings } from '@/hooks/useListings';

export default function Profile() {
  const { address, isConnected } = useAccount();

  const { data: myNFTs = [], isLoading: loadingNFTs } = useNFTs({ owner: address });
  const { data: allListings = [], isLoading: loadingListings } = useListings();
  const myListings = allListings.filter(l => l.seller.toLowerCase() === (address?.toLowerCase() ?? ''));
  const nftMap = Object.fromEntries(myNFTs.map(n => [`${n.collectionAddress}-${n.tokenId}`, n]));

  if (!isConnected) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-40 gap-8">
          <img src="/logo-stack.png" alt="KalaKriti" className="w-32 opacity-60" />
          <h2 className="font-serif text-[40px] text-ivory">Connect Your Wallet</h2>
          <p className="font-sans text-[16px] text-secondary">
            Connect to view your NFTs and manage your listings.
          </p>
          <ConnectButton label="Connect Wallet" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16 space-y-16">
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

        <div className="max-w-sm">
          <WithdrawPanel />
        </div>

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
                  listing={allListings.find(
                    l => l.collectionAddress === nft.collectionAddress &&
                         l.tokenId === nft.tokenId &&
                         l.active
                  )}
                />
              ))}
            </div>
          )}
        </section>

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
