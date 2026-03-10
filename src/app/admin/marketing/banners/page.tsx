
"use client"

import { useState, useRef } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ImageIcon, Plus, Trash2, Camera, X, Loader2, ArrowLeft, ImagePlus, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function BannerAdmin() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [newBannerData, setNewBannerData] = useState({
    title: '',
    description: '',
    link: ''
  });

  const bannersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  const { data: banners, isLoading } = useCollection(bannersRef);

  const optimizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    
    for (const file of fileList) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          variant: "destructive", 
          title: "Imagen demasiado pesada", 
          description: `"${file.name}" supera los 5MB. Elige una más pequeña.` 
        });
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await optimizeImage(reader.result as string);
        setPreviews(prev => [...prev, optimized]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadBanners = async () => {
    if (!firestore || previews.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;

    try {
      for (const img of previews) {
        await addDoc(collection(firestore, 'banners'), {
          imageUrl: img,
          title: newBannerData.title,
          description: newBannerData.description,
          link: newBannerData.link,
          createdAt: new Date().toISOString()
        });
        successCount++;
      }
      
      setPreviews([]);
      setNewBannerData({ title: '', description: '', link: '' });
      toast({ title: `¡${successCount} banner(s) publicados!`, description: "Ya son visibles en el carrusel de inicio." });
    } catch (e: any) {
      console.error(e);
      toast({ 
        variant: "destructive", 
        title: "Error al guardar", 
        description: "Hubo un problema al subir las imágenes."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteBanner = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'banners', id));
    toast({ title: "Banner eliminado" });
  };

  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-accent" />
            Gestión del Carrusel Principal
          </h1>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="rounded-xl shadow-lg bg-accent hover:bg-accent/90"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Subir desde Galería
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="rounded-[32px] shadow-sm border-none overflow-hidden bg-white">
              <CardHeader className="bg-accent/5">
                <CardTitle className="text-lg">Nuevas Imágenes</CardTitle>
                <CardDescription>Configura los textos y enlaces para las fotos.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileChange} 
                />
                
                <div className="grid grid-cols-2 gap-2">
                  {previews.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border-2 border-accent bg-muted group">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePreview(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previews.length === 0 && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center border-muted-foreground/20 hover:border-accent hover:bg-accent/5 cursor-pointer transition-all"
                    >
                      <Camera className="w-6 h-6 mb-1 text-muted-foreground opacity-20" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Galería</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título (Opcional)</Label>
                    <Input 
                      placeholder="ej. Nueva Temporada" 
                      className="rounded-xl"
                      value={newBannerData.title}
                      onChange={e => setNewBannerData({...newBannerData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción (Opcional)</Label>
                    <Input 
                      placeholder="ej. Descubre lo nuevo" 
                      className="rounded-xl"
                      value={newBannerData.description}
                      onChange={e => setNewBannerData({...newBannerData, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <LinkIcon className="w-3 h-3" /> Enlace (URL)
                    </Label>
                    <Input 
                      placeholder="ej. /products/id o https://..." 
                      className="rounded-xl"
                      value={newBannerData.link}
                      onChange={e => setNewBannerData({...newBannerData, link: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full rounded-xl h-12 mt-2" 
                  onClick={uploadBanners} 
                  disabled={isUploading || previews.length === 0}
                >
                  {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                  Publicar en Carrusel
                </Button>

                <div className="p-3 bg-muted/30 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    Puedes subir fotos de hasta 5MB. El sistema las optimizará automáticamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-black text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Banners Activos</h2>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                {banners?.length || 0} Total
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" /></div>
            ) : banners?.map(banner => (
              <div key={banner.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-white/40 flex flex-col md:flex-row gap-4 items-center group hover:shadow-md transition-all">
                <div className="relative w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-muted shrink-0 shadow-inner">
                  <Image src={banner.imageUrl} alt={banner.title || "Banner"} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 text-center md:text-left min-w-0">
                  <h3 className="font-black text-primary truncate">{banner.title || 'Sin título'}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 italic">{banner.description || 'Sin descripción'}</p>
                  {banner.link && (
                    <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold truncate mt-1">
                      <LinkIcon className="w-3 h-3" /> {banner.link}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-destructive rounded-full h-12 w-12 hover:bg-destructive/10" onClick={() => deleteBanner(banner.id)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
            {!isLoading && banners?.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-white/60 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="font-bold">No hay banners cargados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
