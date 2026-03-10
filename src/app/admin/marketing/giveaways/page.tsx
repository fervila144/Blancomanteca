"use client"

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Sparkles, User, Gift } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function GiveawaysAdmin() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [winner, setWinner] = useState<any>(null);
  const [rolling, setRolling] = useState(false);

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users } = useCollection(usersRef);

  const runGiveaway = () => {
    if (!users || users.length === 0) return;
    
    setRolling(true);
    setWinner(null);

    // Simular efecto de "rueda"
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * users.length);
      const chosen = users[randomIndex];
      setWinner(chosen);
      setRolling(false);
      toast({
        title: "¡Tenemos un ganador!",
        description: `El usuario ${chosen.username} ha sido seleccionado.`
      });
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <div className="bg-white rounded-[40px] p-12 shadow-xl border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-accent"></div>
          
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Gran Sorteo BlancoManteca</h1>
          <p className="text-muted-foreground mb-10">
            Participan los <span className="font-bold text-foreground">{users?.length || 0}</span> usuarios registrados.
          </p>

          <div className="min-h-[200px] flex items-center justify-center mb-8 bg-muted/30 rounded-3xl border-2 border-dashed">
            {rolling ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                <p className="font-bold animate-pulse text-accent uppercase tracking-widest">Sorteando...</p>
              </div>
            ) : winner ? (
              <div className="animate-in zoom-in-50 duration-500 text-center">
                <div className="bg-accent/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 border-2 border-accent">
                  <Sparkles className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-3xl font-black text-primary mb-1 uppercase tracking-tight">{winner.username}</h2>
                <Badge variant="outline" className="mb-2">{winner.email}</Badge>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                  <Gift className="w-3 h-3" /> Seleccionado de forma aleatoria
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Pulsa el botón para elegir al ganador</p>
              </div>
            )}
          </div>

          <Button 
            size="lg" 
            className="w-full h-16 rounded-2xl text-xl font-bold bg-accent hover:bg-accent/90 shadow-lg"
            onClick={runGiveaway}
            disabled={rolling || !users?.length}
          >
            {rolling ? 'Calculando Suerte...' : 'Realizar Sorteo'}
          </Button>
        </div>
      </div>
    </main>
  );
}
