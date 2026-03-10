
"use client"

import { useState, useRef } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, Sparkles, Loader2, Save, Camera, X, Plus, Star, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES as MOCK_CATEGORIES } from '@/lib/data-mock';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import Image from 'next/image';

export default function NewProductPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'site');
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);
  const categories = settings?.categories || MOCK_CATEGORIES;
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    brief: '',
    keywords: '',
    status: 'Normal',
    featured: false,
    images: [] as string[]
  });

  const optimizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
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
    
    if (formData.images.length + fileList.length > 4) {
      toast({
        variant: "destructive",
        title: "Límite de imágenes",
        description: "Solo puedes subir hasta 4 imágenes por producto."
      });
      return;
    }

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
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, optimized] 
        }));
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAI = async () => {
    if (!formData.name || !formData.brief || !formData.keywords) {
      toast({
        variant: "destructive",
        title: "Falta Información",
        description: "Completa el nombre, el resumen y las palabras clave para que la IA pueda redactar."
      });
      return;
    }

    setLoadingAI(true);
    try {
      const result = await generateProductDescription({
        productName: formData.name,
        briefDescription: formData.brief,
        keywords: formData.keywords.split(',').map(k => k.trim())
      });
      
      setFormData(prev => ({ ...prev, description: result.generatedDescription }));
      toast({
        title: "Descripción Generada",
        description: "¡La IA ha redactado un texto para tu producto!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error IA",
        description: "No se pudo conectar con el servicio de IA. Inténtalo de nuevo."
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = async () => {
    if (!firestore) return;
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Nombre, categoría y precio son obligatorios."
      });
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        status: formData.status,
        featured: formData.featured,
        keywords: formData.keywords.split(',').map(k => k.trim()),
        images: formData.images,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(firestore, 'products'), productData);
      
      toast({ title: "Producto creado con éxito" });
      router.push('/admin');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un error al guardar en la base de datos. Intenta con menos fotos."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel
        </Link>

        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Producto</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => router.push('/admin')}>Cancelar</Button>
              <Button 
                className="rounded-xl shadow-lg px-8" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Publicar Producto
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="rounded-3xl shadow-sm border-none bg-white">
                <CardHeader>
                  <CardTitle>Detalles Principales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      placeholder="ej. Taza Cerámica Marmoleada" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter((c: string) => c !== 'Todas').map((cat: string) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Nuevo">Nuevo</SelectItem>
                          <SelectItem value="Oferta">Oferta</SelectItem>
                          <SelectItem value="Agotado">Agotado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        Destacar Producto
                      </Label>
                      <p className="text-xs text-muted-foreground">Aparecerá en el carrusel de inicio.</p>
                    </div>
                    <Switch 
                      checked={formData.featured} 
                      onCheckedChange={(val) => setFormData({...formData, featured: val})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio ($)</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Disponible</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm border-accent/20 bg-accent/5 overflow-hidden">
                <CardHeader className="bg-accent/10 border-b border-accent/10">
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Sparkles className="w-5 h-5" />
                    Copywriting con IA
                  </CardTitle>
                  <CardDescription>Deja que la IA redacte la descripción perfecta por ti.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>¿Cómo es el producto?</Label>
                      <Textarea 
                        placeholder="ej. Hecho a mano, textura rugosa, tonos tierra."
                        className="bg-white min-h-[100px] rounded-xl"
                        value={formData.brief}
                        onChange={e => setFormData({...formData, brief: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Palabras Clave</Label>
                      <Textarea 
                        placeholder="ej. artesanal, deco, cocina"
                        className="bg-white min-h-[100px] rounded-xl"
                        value={formData.keywords}
                        onChange={e => setFormData({...formData, keywords: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      className="rounded-xl bg-accent hover:bg-accent/90 shadow-lg"
                      onClick={handleAI}
                      disabled={loadingAI}
                    >
                      {loadingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generar Descripción
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción Final</Label>
                    <Textarea 
                      className="bg-white min-h-[180px] rounded-xl leading-relaxed"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="rounded-3xl shadow-sm border-none bg-white">
                <CardHeader>
                  <CardTitle>Multimedia</CardTitle>
                  <CardDescription>Sube hasta 4 fotos de hasta 5MB cada una.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-muted bg-muted shadow-sm">
                        <Image src={img} alt={`Preview ${index}`} fill className="object-cover" unoptimized />
                        <button 
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1.5 bg-destructive text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 4 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group"
                      >
                        <Camera className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Añadir</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      El sistema optimizará tus fotos de hasta 5MB para que luzcan perfectas sin ralentizar la tienda.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
