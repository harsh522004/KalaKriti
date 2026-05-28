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
        className={cn(
          'w-full h-full object-cover transition-opacity duration-modal',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
