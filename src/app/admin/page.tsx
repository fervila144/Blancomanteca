
"use client"

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  Loader2,
  Users,
  Megaphone,
  Trophy,
  Image as ImageIcon,
  ShoppingBag,
  Layout,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, deleteDoc, collection, updateDoc, query, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Verificación de Roles basada en el perfil del usuario
  useEffect(() => {
    const verifyAccess = async () => {
      if (!firestore || !user) {
        if (!isUserLoading) {
          setIsAuthorized(false);
          setCheckingRole(false);
        }
        return;
      }

      // Acceso directo por UID para el Administrador Principal
      if (user.uid === "joRzb55ya0PQqrdMOHnWyi33EAN2") {
        setIsAuthorized(true);
        setCheckingRole(false);
        return;
      }

      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const role = userData.role;
          // Permitir acceso a admin y stocker
          if (role === 'admin' || role === 'stocker') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error: any) {
        console.error("Error al verificar roles:", error);
        setIsAuthorized(false);
      } finally {
        setCheckingRole(false);
      }
    };

    verifyAccess();
  }, [firestore, user, isUserLoading]);

  // Products Data
  const productsRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return collection(firestore, 'products');
  }, [firestore, isAuthorized]);
  const { data: products, isLoading: isProductsLoading } = useCollection(productsRef);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Requests Data
  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, 'purchase_requests'), orderBy('createdAt', 'desc'));
  }, [firestore, isAuthorized]);
  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsRef);

  // Perfil para ver el rol exacto en la UI
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  if (isUserLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <main className="min-h-screen bg-muted/20">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-6" />
          <h1 className="text-3xl font-bold mb-4">Acceso Restringido</h1>
          <p className="text-muted-foreground mb-8">No tienes permisos para acceder a las herramientas administrativas.</p>
          <Link href="/"><Button>Volver al Inicio</Button></Link>
        </div>
      </main>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (!firestore) return;
    if (!confirm(`¿Borrar "${name}"?`)) return;
    deleteDoc(doc(firestore, 'products', id))
      .then(() => toast({ title: "Eliminado", description: "Producto borrado." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "No se pudo borrar." }));
  };

  const updateRequestStatus = async (request: any, newStatus: string) => {
    if (!firestore) return;
    
    await updateDoc(doc(firestore, 'purchase_requests', request.id), { status: newStatus });

    if (newStatus === 'completed') {
      await addDoc(collection(firestore, 'announcements'), {
        title: "Solicitud Aceptada",
        content: "Aceptamos tu solicitud de compra, nos pondremos en contacto por WhatsApp.",
        type: 'private',
        targetUserId: request.userId,
        active: true,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Pedido aceptado", description: "El usuario ha sido notificado." });
    } else {
      toast({ title: "Estado actualizado", description: `La petición ahora está como ${newStatus}` });
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sesión de</p>
                  <p className="text-sm font-bold capitalize">{profile?.role || 'Personal'}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <h2 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Gestión</h2>
                
                <Button 
                  variant={activeTab === 'products' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start rounded-xl"
                  onClick={() => setActiveTab('products')}
                >
                  <Package className="w-4 h-4 mr-3" /> Productos
                </Button>

                <Button 
                  variant={activeTab === 'requests' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start rounded-xl"
                  onClick={() => setActiveTab('requests')}
                >
                  <ShoppingBag className="w-4 h-4 mr-3" /> Pedidos
                </Button>

                <Separator className="my-2" />
                <h2 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Marketing</h2>
                <Link href="/admin/marketing/announcements" className="w-full">
                  <Button variant="ghost" className="w-full justify-start rounded-xl">
                    <Megaphone className="w-4 h-4 mr-3" /> Anuncios
                  </Button>
                </Link>
                <Link href="/admin/marketing/banners" className="w-full">
                  <Button variant="ghost" className="w-full justify-start rounded-xl">
                    <ImageIcon className="w-4 h-4 mr-3" /> Banners
                  </Button>
                </Link>
                <Link href="/admin/marketing/giveaways" className="w-full">
                  <Button variant="ghost" className="w-full justify-start rounded-xl">
                    <Trophy className="w-4 h-4 mr-3" /> Sorteos
                  </Button>
                </Link>

                {profile?.role === 'admin' && (
                  <>
                    <Separator className="my-2" />
                    <h2 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sistema</h2>
                    <Link href="/admin/users" className="w-full">
                      <Button variant="ghost" className="w-full justify-start rounded-xl">
                        <Users className="w-4 h-4 mr-3" /> Usuarios
                      </Button>
                    </Link>
                    <Link href="/admin/settings" className="w-full">
                      <Button variant="ghost" className="w-full justify-start rounded-xl">
                        <Settings className="w-4 h-4 mr-3" /> Ajustes del Sitio
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {activeTab === 'products' ? 'Panel de Control' : 'Gestión de Pedidos'}
                </h1>
                <p className="text-muted-foreground">Gestionando BlancoManteca como {profile?.role}</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                {activeTab === 'products' && (
                  <>
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar producto..." 
                        className="pl-9 rounded-xl h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Link href="/admin/products/new">
                      <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Nuevo</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {activeTab === 'products' ? (
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio (ARS)</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isProductsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredProducts.length > 0 ? filteredProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                              {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                            </div>
                            {p.name}
                          </div>
                        </TableCell>
                        <TableCell>${p.price?.toLocaleString('es-AR')}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/products/edit/${p.id}`}><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></Link>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id, p.name)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                          No se encontraron productos que coincidan con la búsqueda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto Solicitado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRequestsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : requests?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{r.userName}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {r.userPhone || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground">{r.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted border">
                              {r.productImage && <Image src={r.productImage} alt={r.productName} fill className="object-cover" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{r.productName}</span>
                              <span className="text-xs text-accent font-bold">${r.productPrice?.toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.status === 'pending' && <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>}
                          {r.status === 'completed' && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Completado</Badge>}
                          {r.status === 'cancelled' && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {r.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-500" onClick={() => updateRequestStatus(r, 'completed')} title="Aceptar y Notificar">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => updateRequestStatus(r, 'cancelled')} title="Cancelar">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`https://wa.me/${r.userPhone?.replace(/\D/g, '') || '5492364720911'}?text=${encodeURIComponent(`Hola ${r.userName}, te contacto por tu pedido de ${r.productName} en BlancoManteca.`)}`} target="_blank">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isRequestsLoading && requests?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                          No hay peticiones de compra registradas aún.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
