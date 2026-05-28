import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="max-w-page mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <img src="/logo-horizontal.png" alt="KalaKriti" className="h-8 w-auto opacity-80" />
          <p className="font-sans text-[13px] text-muted text-center md:text-left">
            Own Culture. Own Creativity. Own the Future.
          </p>
        </div>
        <div className="flex items-center gap-8">
          {[['/', 'Explore'], ['/collections', 'Collections'], ['/mint', 'Create']].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="font-sans text-[13px] uppercase tracking-[0.08em] text-muted hover:text-gold transition-colors duration-fast"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="font-sans text-[11px] text-muted">
          Built on Sepolia Testnet · Inspired by Bharat
        </p>
      </div>
    </footer>
  );
}
