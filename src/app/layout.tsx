import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Product Admin',
  description: 'Product management dashboard powered by DummyJSON',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {/*
          AuthProvider wraps the entire tree so every page and layout
          can access auth state via useAuth() without prop drilling.
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
