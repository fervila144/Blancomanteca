
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/navbar';
import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES as MOCK_CATEGORIES } from '@/lib/data-mock';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Megaphone, Sparkles, Edit2, Plus, Trash2, Save, Loader2, Info, MessageCircle, Instagram, Settings2, X, Search } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

export default function CatalogPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [category, setCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  const [isEditingWelcome, setIsEditingWelcome] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isManagingFeatured, setIsManagingFeatured] = useState(false);
  
  const [newWelcomeData, setNewWelcomeData] = useState({ title: '', description: '' });
  const [newShippingText, setNewShippingText] = useState('');
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(userProfileRef);
  
  const isAdmin = profile?.role === 'admin' || user?.uid === "joRzb55ya0PQqrdMOHnWyi33EAN2";

  const productsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: dbProducts, isLoading: isLoadingProducts } = useCollection(productsCollectionRef);

  const featuredProductsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('featured', '==', true));
  }, [firestore]);
  const { data: featuredProducts } = useCollection(featuredProductsRef);

  const bannersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);
  const { data: banners } = useCollection(bannersRef);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'site');
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const announcementsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'announcements');
  }, [firestore]);
  const { data: announcements } = useCollection(announcementsRef);
  
  const activeGlobal = announcements?.find(a => a.active && (a.type === 'global' || !a.type));

  useEffect(() => {
    if (activeGlobal) setShowAnnouncement(true);
  }, [activeGlobal]);

  useEffect(() => {
    if (!user || !firestore) return;
    setDoc(doc(firestore, 'users', user.uid), {
      lastSeen: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  }, [user, firestore]);

  const welcomeTitle = settings?.welcomeTitle || "Colección BlancoManteca";
  const welcomeDescription = settings?.welcomeDescription || "Esenciales para el hogar diseñados con alma y fabricados en Argentina.";
  const shippingInfoText = settings?.shippingInfo || "Envío gratis en CABA y GBA en pedidos superiores a $55.000 ARS";
  const siteCategories = settings?.categories || MOCK_CATEGORIES;

  useEffect(() => {
    if (isEditingCategories) {
      setNewCategories([...siteCategories]);
      setCategoryInput('');
    }
  }, [isEditingCategories, siteCategories]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!firestore || !isAdmin) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteDoc(doc(firestore, 'products', id));
      toast({ title: "Producto eliminado", description: "El catálogo se ha actualizado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto." });
    }
  };

  const toggleFeaturedProduct = async (productId: string, currentFeatured: boolean) => {
    if (!firestore || !isAdmin) return;
    try {
      await updateDoc(doc(firestore, 'products', productId), {
        featured: !currentFeatured
      });
      toast({ 
        title: !currentFeatured ? "Producto Destacado" : "Producto quitado del carrusel",
        description: "El carrusel se actualizará automáticamente."
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del producto." });
    }
  };

  const handleSaveWelcome = async () => {
    if (!settingsRef) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef, {
        welcomeTitle: newWelcomeData.title || welcomeTitle,
        welcomeDescription: newWelcomeData.description || welcomeDescription,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditingWelcome(false);
      toast({ title: "Bienvenida actualizada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!settingsRef) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef, {
        shippingInfo: newShippingText || shippingInfoText,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditingShipping(false);
      toast({ title: "Mensaje de envío actualizado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategories = async () => {
    if (!settingsRef) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef, {
        categories: newCategories,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditingCategories(false);
      toast({ title: "Categorías actualizadas" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (trimmed && !newCategories.includes(trimmed)) {
      setNewCategories([...newCategories, trimmed]);
      setCategoryInput('');
    }
  };

  const removeCategory = (cat: string) => {
    if (cat === 'Todas') return;
    setNewCategories(newCategories.filter(c => c !== cat));
  };

  const allProducts = useMemo(() => {
    const combined = [...(dbProducts || []), ...MOCK_PRODUCTS];
    return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [dbProducts]);

  const carouselItems = useMemo(() => {
    const manualBanners = (banners || []).map(b => ({ type: 'banner', ...b }));
    const featuredItems = (featuredProducts || []).map(p => ({ type: 'product', ...p }));
    
    // Unimos ambos: Primero los banners, luego los productos destacados
    const combined = [...manualBanners, ...featuredItems];
    
    if (combined.length > 0) return combined;
    
    // Fallback si no hay nada configurado específicamente
    return allProducts.slice(0, 3).map(p => ({ type: 'product', ...p }));
  }, [banners, featuredProducts, allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesCategory = category === 'Todas' || p.category === category;
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, category, searchQuery]);

  const LoadingOverlayWithLogo = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-4 pointer-events-none bg-background/20 backdrop-blur-sm transition-all duration-500">
      <div className="animate-in fade-in zoom-in duration-700 flex flex-col items-center text-center">
         {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ height: '50px' }} className="w-auto object-contain mb-6 drop-shadow-2xl" />
         ) : (
            <span className="text-4xl md:text-5xl font-black tracking-tighter text-primary mb-6 drop-shadow-xl">
              BLANCO<span className="font-light text-accent">MANTECA</span>
            </span>
         )}
         <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-xl text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-black">
           <Loader2 className="w-4 h-4 animate-spin text-accent" />
           Cargando
         </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="bg-white/30 backdrop-blur-md border-b border-white/20 py-2 relative z-40">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black tracking-[0.15em] text-accent-foreground uppercase group text-center">
            <Info className="w-3.5 h-3.5 shrink-0 text-accent animate-pulse" />
            <p className="line-clamp-1">{shippingInfoText}</p>
            {isAdmin && (
              <button 
                onClick={() => {
                  setNewShippingText(shippingInfoText);
                  setIsEditingShipping(true);
                }}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded-full hover:bg-white/50"
              >
                <Edit2 className="w-3 h-3 text-accent" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-5 md:gap-6 pb-1 md:pb-0">
            <a href="https://wa.me/5492364720911" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-all text-[#25D366] drop-shadow-sm" title="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/blancomanteca" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/40 rounded-full transition-all text-primary" title="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-4 md:py-10 relative group">
        {isAdmin && (
          <div className="absolute top-8 md:top-12 right-8 md:right-12 z-30 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2 md:gap-3">
            <Button 
              onClick={() => setIsManagingFeatured(true)}
              variant="glass" 
              className="rounded-2xl shadow-2xl h-10 md:h-12 font-black text-[10px] md:text-sm px-4"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2 text-accent" />
              Elegir Destacados
            </Button>
            <Link href="/admin/marketing/banners">
              <Button variant="glass" className="rounded-2xl shadow-2xl h-10 md:h-12 font-black text-[10px] md:text-sm px-4">
                <Settings2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                Banners
              </Button>
            </Link>
          </div>
        )}

        {isLoadingProducts && carouselItems.length === 0 ? (
          <div className="relative">
            <Skeleton className="w-full h-[300px] sm:h-[400px] md:h-[600px] rounded-2xl md:rounded-[3rem] opacity-20" />
            <LoadingOverlayWithLogo />
          </div>
        ) : (
          <Carousel 
            plugins={[autoplayPlugin.current]}
            className="w-full max-w-7xl mx-auto overflow-hidden rounded-2xl md:rounded-[3rem] shadow-xl md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-white/40 border bg-white/40 backdrop-blur-md"
            opts={{
              loop: true,
            }}
          >
            <CarouselContent>
              {carouselItems.map((item: any, idx: number) => (
                <CarouselItem key={item.id || idx}>
                  {item.type === 'banner' ? (
                    <div className="relative h-[250px] sm:h-[400px] md:h-[600px] w-full flex items-center justify-center overflow-hidden group/item">
                      {item.link && (
                        <Link href={item.link} className="absolute inset-0 z-20 cursor-pointer" />
                      )}
                      <Image 
                        src={item.imageUrl} 
                        alt={item.title || "Banner"} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover/item:scale-105"
                        priority={idx === 0}
                        sizes="100vw"
                        unoptimized
                      />
                      {(item.title || item.description) && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-6 md:p-8 text-center pointer-events-none">
                          <h2 className="text-2xl sm:text-4xl md:text-7xl font-black mb-2 md:mb-4 drop-shadow-2xl">{item.title}</h2>
                          <p className="max-w-2xl text-[10px] sm:text-base md:text-xl font-medium opacity-90 drop-shadow-lg line-clamp-3">{item.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-[400px] sm:h-[400px] md:h-[600px] w-full flex flex-col md:flex-row items-center overflow-hidden">
                      <div className="flex-1 p-6 sm:p-8 md:p-24 space-y-4 md:space-y-6 z-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-accent/30 backdrop-blur-xl text-accent-foreground px-3 py-1 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.2em] border border-white/30 mx-auto md:mx-0">
                          <Sparkles className="w-3 h-3" /> Destacado
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter text-primary drop-shadow-sm leading-tight">
                          {item.name}
                        </h2>
                        <div className="pt-4 md:pt-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                          <Link href={`/products/${item.id}`} className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto rounded-full px-10 h-14 md:h-16 text-base md:text-lg font-black shadow-2xl hover:scale-105 transition-all">
                              Ver Detalle
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <div className="relative flex-1 h-[200px] md:h-full w-full">
                        {item.images?.[0] ? (
                          <Image 
                            src={item.images[0]} 
                            alt={item.name} 
                            fill 
                            className="object-cover" 
                            priority={idx === 0}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/20 flex items-center justify-center italic text-muted-foreground">Sin imagen</div>
                        )}
                      </div>
                    </div>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-8 h-14 w-14 bg-white/40 backdrop-blur-xl border-white/40 border-2 shadow-2xl hover:bg-white/60" />
            <CarouselNext className="hidden md:flex right-8 h-14 w-14 bg-white/40 backdrop-blur-xl border-white/40 border-2 shadow-2xl hover:bg-white/60" />
          </Carousel>
        )}
      </section>
      
      <div className="container mx-auto px-4 pt-6 md:pt-10 pb-20 md:pb-24">
        <div className="max-w-3xl mb-8 md:mb-12 relative group text-center md:text-left mx-auto md:mx-0">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-primary drop-shadow-sm">{welcomeTitle}</h1>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-9 w-9 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white/40"
                onClick={() => {
                  setNewWelcomeData({ title: welcomeTitle, description: welcomeDescription });
                  setIsEditingWelcome(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-base sm:text-lg md:text-2xl font-medium leading-relaxed opacity-80">
            {welcomeDescription}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <aside className="lg:w-72 space-y-6 md:space-y-10">
            <div className="space-y-4 md:space-y-6">
              <div className="px-1">
                <div className="relative group/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-accent transition-colors" />
                  <Input 
                    placeholder="Buscar pieza..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 rounded-2xl h-12 bg-white/20 backdrop-blur-md border-white/20 focus:bg-white/40 focus:border-accent/40 transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-[9px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground opacity-60">Filtrar por</h3>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full hover:bg-white/40" 
                    onClick={() => setIsEditingCategories(true)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex flex-row lg:flex-col overflow-x-auto gap-4 md:gap-4 pb-4 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {siteCategories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap block text-[11px] md:text-sm font-black transition-all duration-500 py-3.5 px-7 md:py-4 md:px-10 rounded-2xl md:rounded-3xl border ${
                      category === cat 
                        ? 'bg-accent text-accent-foreground border-accent shadow-[0_12px_24_px_-8px_rgba(236,179,196,0.6)] scale-105 z-10' 
                        : 'bg-white/10 backdrop-blur-2xl text-muted-foreground border-white/20 hover:bg-white/20 hover:border-white/40 hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {isLoadingProducts && allProducts.length === 0 ? (
              <div className="relative min-h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <Skeleton className="aspect-[3/4] w-full rounded-2xl md:rounded-[2rem] bg-muted/40" />
                      <div className="space-y-2 px-2 md:px-4">
                        <Skeleton className="h-3 w-1/3 bg-muted/30" />
                        <Skeleton className="h-4 w-full bg-muted/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10">
                {filteredProducts.map((product, idx) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isAdmin={isAdmin}
                    onDelete={handleDeleteProduct}
                    priority={idx < 4}
                  />
                ))}
              </div>
            )}
            {!isLoadingProducts && filteredProducts.length === 0 && (
              <div className="text-center py-20 md:py-32 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-[3rem] border-2 border-dashed border-white/40 text-muted-foreground italic text-base md:text-lg font-medium px-6">
                {searchQuery ? 'No encontramos lo que buscas, prueba con otros términos.' : 'Explora otras categorías, pronto añadiremos más piezas únicas.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/20 py-12 md:py-16 bg-white/20 backdrop-blur-2xl mt-12 md:mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 md:mb-8">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" style={{ height: '32px' }} className="w-auto object-contain mx-auto opacity-50 grayscale" />
             ) : (
                <span className="text-xl md:text-2xl font-black tracking-tighter text-primary/30 uppercase">
                  BlancoManteca
                </span>
             )}
          </div>
          <p className="text-[10px] md:text-sm text-muted-foreground font-medium px-4">
            Copyright Blanco Manteca 2026 - Diseñado por{" "}
            <a href="https://wa.me/5492364608517" target="_blank" rel="noopener noreferrer" className="font-black text-accent hover:text-accent/80 transition-colors">
              Fernando Vila
            </a>
          </p>
        </div>
      </footer>

      {/* DIÁLOGOS DE ADMINISTRACIÓN */}
      <Dialog open={isManagingFeatured} onOpenChange={setIsManagingFeatured}>
        <DialogContent className="rounded-2xl md:rounded-[3rem] w-[95vw] max-w-2xl p-0 overflow-hidden bg-white/90 backdrop-blur-3xl border-white/40 shadow-2xl">
          <DialogHeader className="p-6 md:p-8 bg-accent/10 border-b border-white/20">
            <DialogTitle className="flex items-center gap-3 text-xl md:text-2xl font-black">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              Destacados
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm font-medium text-muted-foreground">
              Gestiona qué productos aparecen en el carrusel de inicio.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[40vh] md:h-[50vh] p-6 md:p-8">
            <div className="grid grid-cols-1 gap-3 py-2">
              {dbProducts?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/30 hover:bg-white/70 transition-all">
                  <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-white shrink-0 shadow-md border-2 border-white">
                    {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="64px" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-black truncate">{p.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">{p.category}</p>
                  </div>
                  <Switch 
                    className="data-[state=checked]:bg-accent scale-90 md:scale-100"
                    checked={p.featured || false} 
                    onCheckedChange={() => toggleFeaturedProduct(p.id, p.featured || false)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 md:p-8 border-t border-white/20 bg-white/30">
            <Button variant="glass" className="rounded-xl md:rounded-2xl w-full font-black" onClick={() => setIsManagingFeatured(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingWelcome} onOpenChange={setIsEditingWelcome}>
        <DialogContent className="rounded-2xl md:rounded-[3rem] w-[92vw] max-w-lg bg-white/90 backdrop-blur-3xl border-white/40 p-6 md:p-8">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-black">Editar Bienvenida</DialogTitle></DialogHeader>
          <div className="space-y-4 md:space-y-6 py-4 md:py-6">
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-muted-foreground px-1">Título</Label>
              <Input className="rounded-xl md:rounded-2xl h-11 md:h-12 bg-white/60 border-white/40 font-bold" value={newWelcomeData.title} onChange={e => setNewWelcomeData({...newWelcomeData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-muted-foreground px-1">Propuesta</Label>
              <Textarea className="rounded-xl md:rounded-2xl bg-white/60 border-white/40 min-h-[100px] font-medium" value={newWelcomeData.description} onChange={e => setNewWelcomeData({...newWelcomeData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" className="rounded-xl md:rounded-2xl w-full font-black shadow-xl" onClick={handleSaveWelcome} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingShipping} onOpenChange={setIsEditingShipping}>
        <DialogContent className="rounded-2xl md:rounded-[3rem] w-[92vw] max-w-lg bg-white/90 backdrop-blur-3xl border-white/40 p-6 md:p-8">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-black">Información de Envío</DialogTitle></DialogHeader>
          <div className="space-y-4 md:space-y-6 py-4 md:py-6">
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[9px] md:text-[10px] tracking-widest text-muted-foreground px-1">Texto de la barra</Label>
              <Textarea className="rounded-xl md:rounded-2xl bg-white/60 border-white/40 min-h-[80px] font-medium" value={newShippingText} onChange={e => setNewShippingText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" className="rounded-xl md:rounded-2xl w-full font-black shadow-xl" onClick={handleSaveShipping} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingCategories} onOpenChange={setIsEditingCategories}>
        <DialogContent className="rounded-2xl md:rounded-[3rem] w-[92vw] max-w-lg bg-white/90 backdrop-blur-3xl border-white/40 p-6 md:p-8">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-black">Gestionar Categorías</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white/20 rounded-2xl border border-white/20">
              {newCategories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-accent/20 border border-accent/20 px-3 py-1.5 rounded-full text-xs font-bold text-accent-foreground">
                  {cat}
                  {cat !== 'Todas' && (
                    <button onClick={() => removeCategory(cat)} className="text-accent hover:scale-125 transition-transform">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="Ej: Accesorios" 
                value={categoryInput} 
                onChange={e => setCategoryInput(e.target.value)}
                className="rounded-xl h-12 bg-white/60 border-white/40"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button onClick={addCategory} className="rounded-xl h-12 px-6">
                <Plus className="w-4 h-4 mr-2" /> Añadir
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" className="rounded-xl md:rounded-2xl w-full font-black shadow-xl" onClick={handleSaveCategories} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
              Guardar Categorías
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
