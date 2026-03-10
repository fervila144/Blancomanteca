
"use client"

import Link from 'next/link';
import { Bell, User, Moon, Sun, MessageCircle, Instagram, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(profileRef);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'site');
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  const announcementsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'announcements');
  }, [firestore]);

  const { data: allAnnouncements } = useCollection(announcementsRef);
  
  const userNotifications = allAnnouncements?.filter(a => 
    a.active && (a.type === 'global' || !a.type || (a.type === 'private' && a.targetUserId === user?.uid))
  ).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }) || [];

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Vuelve pronto a BlancoManteca." });
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return (profile?.username || user.displayName || user.email || 'U').charAt(0).toUpperCase();
  };

  const userPhoto = profile?.photoURL || user?.photoURL;

  const displayName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() 
    : (profile?.username || user?.displayName || 'Usuario');

  return (
    <nav className="glass-nav mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl sm:rounded-3xl top-2 sm:top-4 border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-all transform hover:scale-105">
            {settings?.logoUrl ? (
              <div 
                style={{ height: `${Math.min(settings.logoHeight || 36, 40)}px` }} 
                className="relative w-auto max-h-[40px] md:max-h-none"
              >
                <img 
                  src={settings.logoUrl} 
                  alt="BLANCOMANTECA" 
                  className="h-full w-auto object-contain drop-shadow-sm"
                />
              </div>
            ) : (
              <span className="text-xl sm:text-3xl font-black tracking-tighter text-primary">
                BLANCO<span className="font-light text-accent">MANTECA</span>
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center mr-2 sm:mr-4 gap-1">
            <a href="https://wa.me/5492364720911" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/40 rounded-full transition-all text-[#25D366]" title="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/blancomanteca" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/40 rounded-full transition-all text-primary" title="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full p-0.5 sm:p-1 border border-white/30 shadow-inner">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/40" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/40">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {userNotifications.length > 0 && (
                    <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[85vw] sm:w-80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-2xl border-white/40 bg-white/90 backdrop-blur-3xl mt-4" align="end">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-1">Avisos</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                    {userNotifications.length > 0 ? (
                      userNotifications.map(n => (
                        <div key={n.id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-colors group">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="p-1.5 bg-accent/20 rounded-lg">
                              <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">{n.title}</span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-relaxed">{n.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sin novedades</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {!user ? (
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/40"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full h-8 w-8 sm:h-10 sm:w-10 overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform ml-0.5 sm:ml-1">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userPhoto || undefined} />
                      <AvatarFallback className="bg-accent/20 text-accent font-black text-[10px] sm:text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 sm:w-64 rounded-2xl sm:rounded-[2rem] p-2 sm:p-3 mt-4 shadow-2xl border-white/40 bg-white/90 backdrop-blur-3xl" align="end">
                  <DropdownMenuLabel className="px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm sm:text-base font-black leading-tight text-primary truncate">{displayName}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-muted-foreground uppercase truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-1 my-1 bg-white/20" />
                  
                  {(profile?.role === 'admin' || profile?.role === 'stocker') && (
                    <DropdownMenuItem className="rounded-xl sm:rounded-2xl cursor-pointer p-3 sm:p-4 font-black text-accent hover:bg-accent/10 focus:bg-accent/10 focus:text-accent" asChild>
                      <Link href="/admin" className="flex items-center">
                        <LayoutDashboard className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Panel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem className="rounded-xl sm:rounded-2xl cursor-pointer p-3 sm:p-4 font-bold hover:bg-white/40 focus:bg-white/40" asChild>
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-3 h-4 w-4 sm:h-5 sm:w-5 opacity-60" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="mx-1 my-1 bg-white/20" />
                  
                  <DropdownMenuItem 
                    className="rounded-xl sm:rounded-2xl cursor-pointer p-3 sm:p-4 font-bold text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Salir</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
