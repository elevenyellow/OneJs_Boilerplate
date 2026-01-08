import { DM_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const fontHeading = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const fontVariables = cn(
  fontSans.variable,
  fontHeading.variable,
  fontMono.variable
);

export const fontClasses = {
  sans: fontSans.className,
  heading: fontHeading.className,
  mono: fontMono.className,
};




