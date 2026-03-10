
'use client';

import React from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Construction, MessageCircle, Lock } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'site');
  }, [firestore]);

  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Si estamos cargando la configuración esencial, mostramos loader
  if (isSettingsLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || user?.uid === "joRzb55ya0PQqrdMOHnWyi33EAN2";
  const isMaintenanceMode = settings?.maintenanceMode === true;

  // Si el modo mantenimiento está activo y el usuario NO es admin
  if (isMaintenanceMode && !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white/40 backdrop-blur-3xl p-8 sm:p-12 rounded-[40px] border border-white/40 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-accent/20">
            <Construction className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-primary uppercase">
            Pausa<span className="font-light text-accent"> Creativa</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Estamos actualizando nuestra colección para ofrecerte piezas aún más especiales. Blanco Manteca volverá muy pronto.
          </p>
          <div className="pt-6">
            <a 
              href="https://wa.me/5492364720911" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/60 hover:bg-white/80 px-6 py-3 rounded-2xl border border-white/40 text-xs font-black uppercase tracking-widest text-primary transition-all shadow-lg"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              Consultas Directas
            </a>
          </div>
          
          <div className="pt-8 border-t border-white/20">
            <Link 
              href="/login"
              className="flex items-center gap-2 mx-auto text-[10px] text-muted-foreground/60 hover:text-accent font-bold uppercase tracking-[0.2em] transition-colors"
            >
              <Lock className="w-3 h-3" />
              Acceso Administración
            </Link>
          </div>

          <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">
            Blanco Manteca &copy; 2026
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
