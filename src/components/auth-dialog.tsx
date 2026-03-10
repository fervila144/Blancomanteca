
"use client"

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Mail, User as UserIcon, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "¡Bienvenido a Blanco Manteca!", 
          description: "Has iniciado sesión correctamente." 
        });
      } else {
        if (!username.trim()) {
          toast({ variant: "destructive", title: "Campo requerido", description: "El nombre de usuario es obligatorio." });
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: username
        });

        const role = username.toLowerCase() === 'ferhtml' ? 'admin' : 'user';
        
        const userData = {
          id: user.uid,
          email: user.email,
          username: username,
          role: role,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, userData);

        toast({ 
          title: "¡Bienvenido a Blanco Manteca!", 
          description: `Tu cuenta ha sido creada con éxito, ${username}.` 
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMessage = "Ocurrió un error. Verifica tus datos.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === 'auth/invalid-credential') {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px] rounded-[32px] p-6 border-none shadow-2xl bg-white overflow-hidden">
        <DialogHeader className="space-y-1 mb-2">
          <div className="flex justify-center mb-1">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-center text-primary">
            {isLogin ? 'Hola de nuevo' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-[10px] px-4 font-medium leading-tight">
            {isLogin 
              ? 'Accede para ver tus favoritos y gestionar tus pedidos.' 
              : 'Únete y descubre piezas únicas de Blanco Manteca.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAuth} className="space-y-3">
          {!isLogin && (
            <div className="space-y-1">
              <Label htmlFor="username" className="text-[9px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-accent" /> Usuario
              </Label>
              <Input 
                id="username" 
                placeholder="ej. Romi_123" 
                className="rounded-xl h-10 bg-muted/30 border-none focus-visible:ring-accent/50 text-sm font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
              <Mail className="w-3 h-3 text-accent" /> Correo
            </Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tu@email.com" 
              className="rounded-xl h-10 bg-muted/30 border-none focus-visible:ring-accent/50 text-sm font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
              <Lock className="w-3 h-3 text-accent" /> Contraseña
            </Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              className="rounded-xl h-10 bg-muted/30 border-none focus-visible:ring-accent/50 text-sm font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <Button 
            className="w-full h-12 rounded-xl text-sm font-black shadow-lg mt-2 bg-primary hover:bg-primary/90 transition-all" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              isLogin ? 'Entrar ahora' : 'Registrarme'
            )}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.2em]">
            <span className="bg-white px-3 text-muted-foreground/40">o también</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl border-2 border-accent/20 hover:bg-accent/5 hover:border-accent font-black text-[#C46D86] transition-all flex items-center justify-center gap-2" 
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          disabled={loading}
        >
          {isLogin ? (
            <>
              Registrate <ArrowRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <ArrowLeft className="w-3 h-3" /> Ya tengo cuenta
            </>
          )}
        </Button>

        <p className="text-center text-[8px] mt-4 text-muted-foreground/60 font-medium uppercase tracking-widest">
          Blanco Manteca &copy; 2026
        </p>
      </DialogContent>
    </Dialog>
  );
}
