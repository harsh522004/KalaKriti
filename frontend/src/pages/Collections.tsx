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
