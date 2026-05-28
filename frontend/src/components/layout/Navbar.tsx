import { Link, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search } from 'lucide-react';

const NAV_LINKS = [
  { to: '/',            label: 'Explore'     },
  { to: '/collections', label: 'Collections' },
  { to: '/mint',        label: 'Create'      },
  { to: '/profile',     label: 'Profile'     },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link to="/" className="flex-shrink-0">
          <img src="/logo-horizontal.png" alt="KalaKriti" className="h-9 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `font-sans text-[13px] uppercase tracking-[0.08em] transition-colors duration-fast ${
                  isActive ? 'text-gold' : 'text-secondary hover:text-ivory'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-muted hover:text-gold transition-colors duration-fast">
            <Search size={18} />
          </button>
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            label="Connect Wallet"
          />
        </div>
      </div>
    </nav>
  );
}
