// autoloan-nextjs-metafullstack/src/app/layout.tsx
import type { Metadata } from 'next';
import { ThemeRegistry } from '@/theme';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'AutoLoan - Vehicle Financing Made Simple',
  description: 'Apply for auto loans online with a streamlined application process',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
