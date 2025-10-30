import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Linghuist',
  description: 'Removes boundaries in language learning.',
};

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
