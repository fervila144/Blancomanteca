"use client"

import { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LogOut, Camera, Lock, LayoutDashboard, User as UserIcon, Mail, MapPin, Loader2, Settings } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { signOut, updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
          <p className="text-muted-foreground font-medium">Cargando perfil de BlancoManteca...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultTab = searchParams.get('tab') || 'account';
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    photoURL: '',
    address: ''
  });

  const [hasInitialized, setHasInitialized] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile && !hasInitialized) {
      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username || user?.displayName || '',
        email: profile.email || user?.email || '',
        photoURL: profile.photoURL || user?.photoURL || '',
        address: profile.address || ''
      });
      setHasInitialized(true);
    }
  }, [profile, user, hasInitialized]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const handleSaveProfile = async () => {
    if (!user || !userProfileRef) return;
    setIsUpdating(true);
    
    try {
      // Actualizar perfil de autenticación si el nombre de usuario cambió
      if (profileData.username !== user.displayName) {
        await updateProfile(user, {
          displayName: profileData.username
        });
      }

      // Guardar datos extendidos en Firestore
      await setDoc(userProfileRef, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        email: profileData.email,
        photoURL: profileData.photoURL,
        address: profileData.address,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Perfil actualizado",
        description: "Tus datos personales se han guardado correctamente.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del perfil.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!user || !userProfileRef) return;
    setIsUpdating(true);

    try {
      // 1. Actualizar Email si cambió
      if (profileData.email !== user.email && profileData.email.trim() !== "") {
        await updateEmail(user, profileData.email);
        // También actualizamos en Firestore para mantener coherencia
        await setDoc(userProfileRef, { email: profileData.email }, { merge: true });
      }

      // 2. Actualizar Contraseña si se ingresó algo
      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
          setIsUpdating(false);
          return;
        }
        await updatePassword(user, passwords.newPassword);
        setPasswords({ newPassword: '', confirmPassword: '' });
      }

      toast({
        title: "Configuración actualizada",
        description: "Tus credenciales de acceso han sido modificadas.",
      });
    } catch (error: any) {
      console.error(error);
      let msg = "No se pudo actualizar la configuración.";
      if (error.code === 'auth/requires-recent-login') {
        msg = "Por seguridad, vuelve a iniciar sesión para realizar cambios en tu email o contraseña.";
      }
      toast({ variant: "destructive", title: "Error de seguridad", description: msg });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isUserLoading || (isProfileLoading && !hasInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const displayName = profileData.firstName || profileData.lastName 
    ? `${profileData.firstName} ${profileData.lastName}`.trim() 
    : profileData.username;

  return (
    <main className="min-h-screen pb-20 bg-muted/10">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-64 space-y-8">
            <div className="text-center md:text-left">
              <div className="relative w-32 h-32 mx-auto md:mx-0 mb-6 group">
                <Avatar className="w-full h-full border-4 border-white shadow-xl">
                  <AvatarImage src={profileData.photoURL} alt={profileData.username} />
                  <AvatarFallback className="bg-accent/10 text-accent text-3xl font-bold uppercase">
                    {profileData.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
              
              <h2 className="text-2xl font-bold truncate">
                {displayName}
              </h2>
              <p className="text-muted-foreground text-sm truncate mb-4">{profileData.email}</p>
              
              {profile?.role && (
                <Badge variant="outline" className="uppercase text-[10px] tracking-widest font-bold border-accent text-accent mb-6">
                  {profile.role === 'user' ? 'cliente' : profile.role}
                </Badge>
              )}
            </div>

            <nav className="space-y-2">
              {(profile?.role === 'admin' || profile?.role === 'stocker') && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full justify-start rounded-xl border-accent/20 text-accent hover:bg-accent hover:text-white transition-all">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Panel Administrativo
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:bg-destructive/10 font-medium rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </nav>
          </div>

          <div className="flex-1">
            <Tabs defaultValue={defaultTab} className="space-y-8">
              <TabsList className="bg-white p-1 rounded-2xl h-auto flex flex-wrap gap-2 shadow-sm border">
                <TabsTrigger value="account" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">Mi Información</TabsTrigger>
                <TabsTrigger value="config" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <Card className="rounded-[32px] shadow-sm border-none bg-white overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-8">
                    <CardTitle className="text-xl">Datos Personales</CardTitle>
                    <CardDescription>Gestiona tus ajustes de envío y perfil público.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><UserIcon className="w-3 h-3" /> Nombre</Label>
                        <Input 
                          placeholder="Tu nombre" 
                          value={profileData.firstName} 
                          onChange={e => setProfileData({...profileData, firstName: e.target.value})} 
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><UserIcon className="w-3 h-3" /> Apellidos</Label>
                        <Input 
                          placeholder="Tus apellidos" 
                          value={profileData.lastName} 
                          onChange={e => setProfileData({...profileData, lastName: e.target.value})} 
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">@ Usuario</Label>
                        <Input 
                          placeholder="crea tu nombre de usuario" 
                          value={profileData.username} 
                          onChange={e => setProfileData({...profileData, username: e.target.value})} 
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Dirección de Envío</Label>
                        <Input 
                          placeholder="Calle, Número, Localidad" 
                          value={profileData.address} 
                          onChange={e => setProfileData({...profileData, address: e.target.value})} 
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t p-8 flex justify-end">
                    <Button 
                      className="rounded-xl px-10 h-12 shadow-lg shadow-primary/20" 
                      onClick={handleSaveProfile}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar Perfil"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="config">
                <Card className="rounded-[32px] shadow-sm border-none bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Settings className="w-5 h-5 text-accent" />
                      Configuración de Acceso
                    </CardTitle>
                    <CardDescription>Gestiona tu correo electrónico y contraseña.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="max-w-md space-y-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground"><Mail className="w-3 h-3" /> Correo Electrónico</Label>
                        <Input 
                          type="email"
                          placeholder="tu@email.com"
                          value={profileData.email} 
                          onChange={e => setProfileData({...profileData, email: e.target.value})}
                          className="rounded-xl h-11" 
                        />
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Seguridad</p>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Lock className="w-3 h-3" /> Nueva Contraseña</Label>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwords.newPassword}
                            onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                            className="rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Lock className="w-3 h-3" /> Repetir Contraseña</Label>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwords.confirmPassword}
                            onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                            className="rounded-xl h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t p-8">
                    <Button 
                      className="rounded-xl px-8 h-12 shadow-lg"
                      onClick={handleUpdateAccount}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar Configuración"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}