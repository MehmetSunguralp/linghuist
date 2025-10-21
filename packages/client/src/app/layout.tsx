import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Linghuist',
  description: 'AI-powered language learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
