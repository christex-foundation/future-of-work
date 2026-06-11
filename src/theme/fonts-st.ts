import { Bricolage_Grotesque, Fraunces, Manrope } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Satoshi Variable Font - Primary font for ST body text
 * Supports weights 300-900 (use font-weight to control)
 */
const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  weight: '300 900',
});

/**
 * Archivo Semi Expanded - Secondary font for ST headings
 * Multiple weights for different heading styles
 */
const archivo = localFont({
  src: [
    {
      path: '../../public/fonts/Archivo_SemiExpanded-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archivo_SemiExpanded-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archivo_SemiExpanded-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-archivo',
  display: 'swap',
});

/**
 * DM Sans Variable Font - Used for specific ST heading styles
 * Supports weights 100-900 (use font-weight to control)
 */
const dmSans = localFont({
  src: '../../public/fonts/DMSans-Variable.ttf',
  variable: '--font-dm-sans',
  display: 'swap',
  weight: '100 900',
});

/**
 * Fraunces - Serif display font for the Future of Work brand.
 * Used for hero/section headings and the wordmark (matches the design system).
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

/**
 * Bricolage Grotesque - Chunky display font for the "Pop" listing detail theme.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['500', '700', '800'],
});

/**
 * Manrope - Friendly body font paired with Bricolage on the "Pop" listing theme.
 */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/**
 * Combined font class names for applying to ST pages
 */
export const stFontVariables = [
  satoshi.variable,
  archivo.variable,
  dmSans.variable,
  fraunces.variable,
  bricolage.variable,
  manrope.variable,
].join(' ');
