"use client"

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Mail, User as UserIcon, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function RegisterPage({ searchParams }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const resolvedSearchParams = use(searchParams);
  const redirectPath = (resolvedSearchParams?.redirect as string) || '/';

  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    if (!username.trim()) {
      toast({ variant: "destructive", title: "Campo requerido", description: "El nombre de usuario es obligatorio." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: username
      });

      const role = username.toLowerCase() === 'ferhtml' ? 'admin' : 'user';
      
      const userData = {
        id: newUser.uid,
        email: newUser.email,
        username: username,
        role: role,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userRef, userData);

      toast({ 
        title: "¡Bienvenido a Blanco Manteca!", 
        description: `Tu cuenta ha sido creada con éxito, ${username}.` 
      });
      router.push(redirectPath);
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMessage = "Ocurrió un error. Verifica tus datos.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      toast({ 
        variant: "destructive", 
        title: "Error de Registro", 
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-white/40 backdrop-blur-3xl p-8 rounded-[40px] border border-white/40 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-accent/10 rounded-2xl">
                <UserIcon className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase">
              Crear<span className="font-light text-accent"> Cuenta</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Únete y descubre piezas únicas de Blanco Manteca.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-accent" /> Usuario
              </Label>
              <Input 
                id="username" 
                placeholder="ej. Romi_123" 
                className="rounded-2xl h-12 bg-white/60 border-white/20 focus-visible:ring-accent/50 text-sm font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-accent" /> Correo Electrónico
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                className="rounded-2xl h-12 bg-white/60 border-white/20 focus-visible:ring-accent/50 text-sm font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-accent" /> Contraseña
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="rounded-2xl h-12 bg-white/60 border-white/20 focus-visible:ring-accent/50 text-sm font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-base font-black shadow-xl mt-4 bg-primary hover:bg-primary/90 transition-all" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Registrarme <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]">
              <span className="bg-transparent px-4 text-muted-foreground/60">¿Ya tienes cuenta?</span>
            </div>
          </div>

          <Link href={`/login${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`} className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-2 border-accent/20 hover:bg-accent/5 hover:border-accent font-black text-accent transition-all flex items-center justify-center gap-2" 
            >
              Iniciar Sesión <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
