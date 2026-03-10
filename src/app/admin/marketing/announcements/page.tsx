
"use client"

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Megaphone, Plus, Trash2, Power, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AnnouncementsAdmin() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const announcementsRef = useMemoFirebase(() => {
    // Solo consultamos si hay un usuario autenticado
    if (!firestore || !user) return null;
    return collection(firestore, 'announcements');
  }, [firestore, user]);

  const { data: announcements, isLoading } = useCollection(announcementsRef);

  const createAnnouncement = async () => {
    if (!firestore || !title) return;
    await addDoc(collection(firestore, 'announcements'), {
      title,
      content,
      type: 'global',
      active: true,
      createdAt: new Date().toISOString()
    });
    setTitle(''); setContent('');
    toast({ title: "Anuncio creado" });
  };

  const toggleActive = (id: string, current: boolean) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'announcements', id), { active: !current });
  };

  const deleteAnn = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'announcements', id));
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-accent" />
          Gestión de Anuncios
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
            <h2 className="font-bold">Nuevo Anuncio Global</h2>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="¡Nueva Colección!" />
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Descripción del anuncio..." />
            </div>
            <Button className="w-full rounded-xl" onClick={createAnnouncement}>
              <Plus className="mr-2 h-4 w-4" /> Emitir Anuncio
            </Button>
          </div>

          <div className="md:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-accent" />
              </div>
            ) : announcements?.map(ann => (
              <div key={ann.id} className="bg-white p-6 rounded-3xl shadow-sm border flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground">{ann.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(ann.id, ann.active)}>
                    <Power className={`w-4 h-4 ${ann.active ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAnn(ann.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && announcements?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No hay anuncios creados todavía.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
