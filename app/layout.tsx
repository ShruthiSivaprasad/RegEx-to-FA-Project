import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RegExp → Automaton Converter | Thompson\'s Construction',
  description:
    'Convert regular expressions to ε-NFA using Thompson\'s Construction and to DFA using Subset Construction. Visualize automata with interactive graphs and step-by-step simulation.',
  keywords: ['regular expression', 'NFA', 'DFA', 'Thompson\'s construction', 'finite automaton', 'subset construction', 'theory of computation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
