
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import DynamicFavicon from '@/components/dynamic-favicon';
import MaintenanceGuard from '@/components/maintenance-guard';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Blanco Manteca',
  description: 'Artículos para el hogar seleccionados para un estilo de vida moderno.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <FirebaseClientProvider>
          <DynamicFavicon />
          <MaintenanceGuard>
            {children}
          </MaintenanceGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
