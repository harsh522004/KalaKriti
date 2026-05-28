import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function AddressDisplay({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copy = () => {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 font-mono text-[13px] text-muted hover:text-ivory transition-colors duration-fast group"
    >
      <span>{short}</span>
      {copied
        ? <Check size={12} className="text-gold" />
        : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  );
}
