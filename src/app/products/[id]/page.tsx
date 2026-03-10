
"use client"

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PRODUCTS as MOCK_PRODUCTS } from '@/lib/data-mock';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Star, ShoppingBag, Loader2, Phone, User as UserIcon, Send, ArrowLeft, Ban, Package, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [quantity, setQuantity] = useState(1);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Intentar cargar producto desde Firestore
  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);
  
  const { data: dbProduct, isLoading: isLoadingProduct } = useDoc(productRef);

  // Si no está en Firestore, buscar en MOCK_PRODUCTS (fallback)
  const product = dbProduct || MOCK_PRODUCTS.find(p => p.id === id);

  // Fetch Current User Profile
  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(currentUserRef);

  // Fetch Reviews
  const reviewsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'products', id, 'reviews'), orderBy('createdAt', 'desc'));
  }, [firestore, id]);
  const { data: reviews, isLoading: isLoadingReviews } = useCollection(reviewsRef);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1 rounded-xl" />
                <Skeleton className="h-14 w-1/4 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link href="/">
          <Button className="rounded-xl">Volver al Catálogo</Button>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/products/${id}`);
      return;
    }

    if (!reviewComment.trim()) {
      toast({
        variant: "destructive",
        title: "Comentario vacío",
        description: "Por favor escribe algo sobre el producto.",
      });
      return;
    }

    if (!firestore) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(firestore, 'products', id, 'reviews'), {
        userId: user.uid,
        userName: profile?.username || user.displayName || user.email?.split('@')[0] || 'Usuario Anónimo',
        userPhoto: profile?.photoURL || user.photoURL || '',
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      });

      setReviewComment('');
      setReviewRating(5);
      toast({
        title: "¡Gracias!",
        description: "Tu reseña ha sido publicada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo publicar la reseña.",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const productImages = product.images || [];
  const productPrice = product.price || 0;
  const productName = product.name || 'Producto';
  const whatsappNumber = "5492364720911";
  const message = `Hola Romi, ¡me interesa este producto! \n\nProducto: ${productName}\nCantidad: ${quantity}\nPrecio: $${(productPrice * quantity).toLocaleString('es-AR')} ARS`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-24">
          <div className="space-y-4">
            {productImages.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {productImages.map((img: string, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className={`aspect-[4/5] relative overflow-hidden rounded-3xl bg-muted shadow-sm ${isOutOfStock ? 'grayscale-[0.4]' : ''}`}>
                        <Image 
                          src={img} 
                          alt={`${productName} - ${idx + 1}`} 
                          fill 
                          className="object-cover" 
                          priority={idx === 0}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          unoptimized
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {productImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4 bg-white/50 backdrop-blur-md border-none" />
                    <CarouselNext className="right-4 bg-white/50 backdrop-blur-md border-none" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-[4/5] relative overflow-hidden rounded-3xl bg-muted shadow-sm flex items-center justify-center text-muted-foreground/30 italic">
                Imagen no disponible
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                    {product.status !== 'Normal' ? product.status : (product.category || 'General')}
                  </Badge>
                  {!isOutOfStock && (
                    <Badge variant="outline" className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 border-accent/30 text-accent">
                      <Package className="w-3 h-3" /> 
                      {product.stock === 1 ? '¡Última Unidad!' : `${product.stock} Disponibles`}
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="secondary" className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Sin Stock
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${averageRating >= s ? 'fill-current' : 'text-muted'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground ml-1">{averageRating > 0 ? averageRating : 'N/A'}</span>
                  <span className="text-xs text-muted-foreground">({reviews?.length || 0})</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary">{productName}</h1>
              <p className="text-2xl font-semibold text-accent">${productPrice.toLocaleString('es-AR')} ARS</p>
              
              <p className="text-muted-foreground text-lg leading-relaxed pt-4 whitespace-pre-wrap">
                {product.description || 'Sin descripción disponible.'}
              </p>

              <div className="pt-8">
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  {!isOutOfStock ? (
                    <>
                      <div className="flex items-center border rounded-xl overflow-hidden h-14 bg-white dark:bg-card">
                        <button 
                          className="px-4 py-2 hover:bg-muted transition-colors border-r h-full font-bold"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          -
                        </button>
                        <span className="px-6 py-2 font-bold flex items-center justify-center h-full min-w-[3rem]">{quantity}</span>
                        <button 
                          className="px-4 py-2 hover:bg-muted transition-colors border-l h-full font-bold"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        >
                          +
                        </button>
                      </div>
                      
                      <Button className="flex-1 h-14 text-lg rounded-xl shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold flex items-center justify-center gap-2" asChild>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366]" />
                          <span>Consultar por WhatsApp</span>
                        </a>
                      </Button>
                    </>
                  ) : (
                    <div className="w-full p-6 bg-muted/50 rounded-2xl border-2 border-dashed border-muted text-center">
                      <p className="text-muted-foreground font-bold flex items-center justify-center gap-2">
                        <Ban className="w-5 h-5" /> Producto temporalmente sin stock
                      </p>
                      <Button variant="link" className="text-accent mt-2" asChild>
                        <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola Romi, me interesa el producto " + productName + " pero figura sin stock. ¿Cuándo volverá a entrar?")}`} target="_blank" rel="noopener noreferrer">
                          Consultar próxima reposición
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE RESEÑAS */}
        <div className="mt-24 max-w-4xl mx-auto">
          <Separator className="mb-12" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Opiniones Reales</h3>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${averageRating >= s ? 'fill-current' : 'text-muted'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{averageRating > 0 ? `${averageRating} de 5` : 'Aún sin opiniones'}</span>
                </div>
              </div>

              <div className="bg-accent/5 rounded-[32px] p-8 border border-accent/10">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-accent" />
                  Deja tu opinión
                </h4>
                
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Tu Calificación</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 ${reviewRating >= star ? 'text-yellow-500 fill-current' : 'text-muted'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Comentario</Label>
                      <Textarea 
                        placeholder="¿Qué te pareció el producto?" 
                        className="bg-white rounded-2xl resize-none"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>

                    <Button 
                      className="w-full rounded-xl bg-accent hover:bg-accent/90 text-white font-bold h-12"
                      disabled={isSubmittingReview}
                      type="submit"
                    >
                      {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Publicar Reseña"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-muted-foreground font-medium">Inicia sesión para dejar tu reseña.</p>
                    <Link href={`/login?redirect=/products/${id}`}>
                      <Button variant="outline" className="w-full rounded-xl border-accent/20 text-accent font-bold">
                        <Lock className="w-3.5 h-3.5 mr-2" /> Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              {isLoadingReviews ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-3xl p-6 border shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.userPhoto} />
                            <AvatarFallback className="bg-accent/10 text-accent font-bold">
                              {(review.userName || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm">{review.userName || 'Usuario Anónimo'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('es-AR') : 'Reciente'}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'text-yellow-500 fill-current' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-[40px] border-2 border-dashed">
                  <UserIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">Aún no hay reseñas para este producto.</p>
                  <p className="text-xs text-muted-foreground">¡Sé el primero en compartir tu experiencia!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
