interface Props {
  weiAmount: string;
  className?: string;
}

export default function PriceDisplay({ weiAmount, className }: Props) {
  const eth = (Number(BigInt(weiAmount)) / 1e18).toFixed(4).replace(/\.?0+$/, '');
  return (
    <span className={`font-serif text-gold ${className ?? ''}`}>
      {eth}{' '}
      <span className="text-[0.8em] font-sans uppercase tracking-widest text-muted">ETH</span>
    </span>
  );
}
