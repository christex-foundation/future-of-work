import {
  Fraunces,
  Hanken_Grotesk,
  JetBrains_Mono,
  Press_Start_2P,
  Silkscreen,
} from 'next/font/google';

// Body / UI — Future of Work product type
const fontSans = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-sans',
});

// Display / brand — Dawn Horizon hero headline + wordmark
const fontSerif = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['Georgia', 'serif'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-serif',
});

// Labels / eyebrows / badges — retro accent
const fontLabel = Silkscreen({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '700'],
  variable: '--font-label',
});

// Rare display moments only (empty states, design-system title)
const fontPixel = Press_Start_2P({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: '400',
  variable: '--font-pixel',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
  fallback: ['Courier New'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-mono',
});

export const fontVariables = [
  fontSans.variable,
  fontSerif.variable,
  fontLabel.variable,
  fontPixel.variable,
  fontMono.variable,
].join(' ');
