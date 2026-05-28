import { Link } from 'react-router-dom';
import { type Collection } from '@/lib/api';
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
