"use client"

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function LoginPage({ searchParams }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { auth, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const resolvedSearchParams = use(searchParams);
  const redirectPath = (resolvedSearchParams?.redirect as string) || '/';

  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ 
        title: "¡Bienvenido de nuevo!", 
        description: "Has iniciado sesión correctamente en Blanco Manteca." 
      });
      router.push(redirectPath);
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMessage = "Ocurrió un error. Verifica tus datos.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Correo o contraseña incorrectos.";
      }
      toast({ 
        variant: "destructive", 
        title: "Error de Acceso", 
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
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase">
              Hola de<span className="font-light text-accent"> nuevo</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Accede a tu cuenta para gestionar tus pedidos.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  Entrar ahora <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]">
              <span className="bg-transparent px-4 text-muted-foreground/60">¿No tienes cuenta?</span>
            </div>
          </div>

          <Link href={`/register${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`} className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-2 border-accent/20 hover:bg-accent/5 hover:border-accent font-black text-accent transition-all flex items-center justify-center gap-2" 
            >
              Registrate aquí <Sparkles className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex justify-center pt-4">
             <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
               <ArrowLeft className="w-3 h-3" /> Volver a la tienda
             </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
