import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center font-sans uppercase tracking-[0.08em] rounded-btn transition-all duration-fast disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-gold text-bg font-medium hover:brightness-110 shadow-gold hover:shadow-gold',
    secondary: 'border border-gold text-gold hover:bg-gold hover:text-bg',
  };

  const sizes = {
    sm: 'text-[12px] px-5 py-2',
    md: 'text-[13px] px-8 py-3',
    lg: 'text-[14px] px-10 py-4',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
