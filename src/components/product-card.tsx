
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/data-mock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, Trash2, ArrowRight, Ban, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (id: string, name: string) => void;
  priority?: boolean;
}

export default function ProductCard({ product, isAdmin, onDelete, priority }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  const getStatusBadges = () => {
    const badges = [];

    // Prioridad 1: Stock (Sin Stock o Cantidad)
    if (isOutOfStock) {
      badges.push(
        <Badge key="out-of-stock" variant="secondary" className="bg-red-500/80 backdrop-blur-md text-white text-[8px] md:text-xs h-auto py-0.5 px-2 border-none flex items-center gap-1">
          <Ban className="w-2 h-2 md:w-3 md:h-3" /> Sin Stock
        </Badge>
      );
    } else {
      if (product.stock === 1) {
        badges.push(
          <Badge key="last-unit" className="bg-accent/90 backdrop-blur-md text-accent-foreground text-[8px] md:text-xs h-auto py-0.5 px-2 border-none font-black uppercase tracking-tighter">
            Última unidad
          </Badge>
        );
      } else {
        badges.push(
          <Badge key="stock-count" variant="outline" className="bg-white/60 backdrop-blur-md text-primary text-[8px] md:text-xs h-auto py-0.5 px-2 border-white/40 font-bold">
            {product.stock} disp.
          </Badge>
        );
      }
    }

    // Prioridad 2: Estado comercial (Nuevo/Oferta)
    if (product.status === 'Nuevo') {
      badges.push(<Badge key="new" className="bg-accent/80 backdrop-blur-md text-accent-foreground text-[8px] md:text-xs h-auto py-0.5 px-2 border-none">Nuevo</Badge>);
    } else if (product.status === 'Oferta') {
      badges.push(<Badge key="sale" variant="destructive" className="bg-destructive/80 backdrop-blur-md text-[8px] md:text-xs h-auto py-0.5 px-2 border-none">Oferta</Badge>);
    }

    return badges;
  };

  const mainImage = product.images?.[0] || null;

  return (
    <div className={`relative group p-0.5 sm:p-1 ${isOutOfStock ? 'opacity-75' : ''}`}>
      <Link href={`/products/${product.id}`}>
        <Card className="product-card-hover rounded-2xl md:rounded-[2rem] border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 overflow-hidden h-full flex flex-col shadow-lg md:shadow-xl">
          <CardContent className="p-0 relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-[1.8rem] m-1.5 md:m-2">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale-[0.5]' : ''}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 text-muted-foreground/20 italic text-[10px]">
                Sin imagen
              </div>
            )}

            {!isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/20 backdrop-blur-md z-10 hidden md:flex">
                <div className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 text-primary font-black text-[10px] flex items-center gap-2 uppercase tracking-widest border border-white/50">
                  <Eye className="w-4 h-4" />
                  Ver producto
                </div>
              </div>
            )}

            <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2 z-20">
              {getStatusBadges()}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-1 pb-4 px-4 md:pt-2 md:pb-6 md:px-6">
            <div className="flex justify-between w-full mb-0.5 md:mb-1">
              <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold truncate">{product.category}</p>
            </div>
            <h3 className="font-bold text-xs md:text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2 min-h-[2em] md:min-h-0">{product.name}</h3>
            <div className="flex items-center justify-between w-full mt-2 md:mt-3">
              <p className="font-black text-primary text-sm md:text-lg">${product.price.toLocaleString('es-AR')}</p>
              {!isOutOfStock && (
                <div className="hidden md:flex items-center gap-1 text-[9px] font-black text-accent uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                  Detalles <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>

      {isAdmin && (
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-8 w-8 md:h-9 md:w-9 rounded-full shadow-2xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all z-30 border-2 border-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete?.(product.id, product.name);
          }}
        >
          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      )}
    </div>
  );
}
