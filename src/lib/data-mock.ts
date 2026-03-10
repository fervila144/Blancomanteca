import { PlaceHolderImages } from './placeholder-images';

export type ProductStatus = 'Normal' | 'Nuevo' | 'Oferta' | 'Agotado';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  status: ProductStatus;
  images: string[];
  stock: number;
  keywords: string[];
}

export const CATEGORIES = ['Todas', 'Cerámicas', 'Textiles', 'Menaje', 'Decoración', 'Velas'];

/**
 * Los productos iniciales se han eliminado para dar paso a la gestión real desde Firestore.
 * El administrador puede añadir nuevos productos desde el panel /admin/products/new
 */
export const PRODUCTS: Product[] = [];
