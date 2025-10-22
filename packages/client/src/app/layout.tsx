import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Linghuist',
  description: 'Removes boundaries in language learning.',
};

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className='dark' style={{ colorScheme: 'dark' }} lang='en'>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
