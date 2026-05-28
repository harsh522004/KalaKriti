import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0F0F0F',
        'bg-2':      '#121212',
        surface:     '#161616',
        elevated:    '#1A1A1A',
        hover:       '#202020',
        gold:        '#C8A96B',
        ivory:       '#F5E9D7',
        indigo:      '#1F2A44',
        bronze:      '#A97142',
        'gold-deep': '#8B6A3E',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        deva:  ['Noto Serif Devanagari', 'serif'],
        mono:  ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        btn:   '12px',
        card:  '20px',
        modal: '28px',
        input: '14px',
        nft:   '24px',
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.35)',
        gold: '0 0 20px rgba(200,169,107,0.18)',
      },
      backgroundImage: {
        'gradient-gold':   'linear-gradient(135deg, #F5E9D7 0%, #C8A96B 45%, #A97142 100%)',
        'gradient-indigo': 'linear-gradient(180deg, #1F2A44 0%, #0F0F0F 100%)',
      },
      maxWidth: {
        page: '1440px',
      },
      transitionDuration: {
        fast:  '250ms',
        page:  '500ms',
        modal: '350ms',
        hero:  '700ms',
      },
    },
  },
  plugins: [],
};

export default config;
