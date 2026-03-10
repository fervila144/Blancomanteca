
"use client"

import Navbar from '@/components/navbar';
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Trash2, 
  UserCog, 
  Ban, 
  Monitor, 
  Globe, 
  Mail,
  ShieldCheck,
  PackageCheck,
  User as UserIcon,
  Crown,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function UsersAdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(currentUserRef);

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersRef);

  // Verificación de acceso
  if (profile && profile.role !== 'admin' && profile.username !== 'ferhtml') {
    router.push('/admin');
    return null;
  }

  const changeRole = async (uid: string, newRole: string) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'users', uid), { role: newRole })
      .then(() => toast({ title: "Rol actualizado", description: `Rango cambiado a ${newRole}` }));
  };

  const banUser = async (uid: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    updateDoc(doc(firestore, 'users', uid), { status: newStatus })
      .then(() => toast({ title: newStatus === 'banned' ? "Usuario Baneado" : "Usuario Activado" }));
  };

  const deleteAccount = async (uid: string) => {
    if (!firestore || !confirm("¿Eliminar permanentemente esta cuenta?")) return;
    deleteDoc(doc(firestore, 'users', uid))
      .then(() => toast({ title: "Cuenta eliminada" }));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-accent text-accent-foreground text-[9px] uppercase tracking-tighter h-4 px-1.5 flex items-center gap-1 border-none shadow-sm">
            <ShieldCheck className="w-2.5 h-2.5" /> Admin
          </Badge>
        );
      case 'stocker':
        return (
          <Badge className="bg-primary text-primary-foreground text-[9px] uppercase tracking-tighter h-4 px-1.5 flex items-center gap-1 border-none shadow-sm">
            <PackageCheck className="w-2.5 h-2.5" /> Stocker
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1.5 flex items-center gap-1 text-muted-foreground border-muted-foreground/30">
            <UserIcon className="w-2.5 h-2.5" /> Cliente
          </Badge>
        );
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <UserCog className="w-8 h-8 text-accent" />
          Gestión de Usuarios
        </h1>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Detalles Técnicos</TableHead>
                <TableHead>Asignar Rango</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : users && users.length > 0 ? users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {u.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500 absolute -top-3 left-1/2 -translate-x-1/2 fill-yellow-500" />
                        )}
                        <Avatar className={`h-10 w-10 border-2 ${u.role === 'admin' ? 'border-yellow-400' : 'border-transparent'}`}>
                          <AvatarImage src={u.photoURL} alt={u.username} />
                          <AvatarFallback className="bg-accent/10 text-accent font-bold">
                            {u.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{u.username || 'Sin nombre'}</span>
                          {getRoleBadge(u.role)}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] space-y-1">
                      <span className="text-muted-foreground">ID: {u.id.substring(0, 8)}...</span>
                      <span className="text-muted-foreground">Unido: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select 
                      className="text-xs bg-muted/50 border-none rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-accent outline-none cursor-pointer"
                      value={u.role || 'user'}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="user">Cliente</option>
                      <option value="stocker">Stocker</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={u.status === 'banned' ? 'destructive' : 'default'}
                      className={`rounded-lg ${u.status !== 'banned' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {u.status === 'banned' ? 'Baneado' : 'Activo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => banUser(u.id, u.status)} title={u.status === 'banned' ? "Activar" : "Banear"}>
                      <Ban className={`w-4 h-4 ${u.status === 'banned' ? 'text-green-500' : 'text-destructive'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAccount(u.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
