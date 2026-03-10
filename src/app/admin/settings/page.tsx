
"use client"

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, ImageIcon, Loader2, Camera, X, RotateCcw, Globe, Maximize2, Construction } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [logoHeight, setLogoHeight] = useState([32]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'site');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl || null);
      setFaviconUrl(settings.faviconUrl || null);
      setLogoHeight([settings.logoHeight || 32]);
      setMaintenanceMode(settings.maintenanceMode || false);
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "Archivo muy pesado", description: "El logo debe pesar menos de 1MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        toast({ variant: "destructive", title: "Archivo muy pesado", description: "El favicon debe pesar menos de 200KB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFaviconUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);
    
    try {
      await setDoc(settingsRef, {
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
        logoHeight: logoHeight[0],
        maintenanceMode: maintenanceMode,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Ajustes guardados",
        description: "La configuración del sitio se ha actualizado correctamente."
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    if (settings) {
      setLogoUrl(settings.logoUrl || null);
      setFaviconUrl(settings.faviconUrl || null);
      setLogoHeight([settings.logoHeight || 32]);
      setMaintenanceMode(settings.maintenanceMode || false);
    } else {
      setLogoUrl(null);
      setFaviconUrl(null);
      setLogoHeight([32]);
      setMaintenanceMode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Construction className="w-8 h-8 text-accent" />
          Ajustes del Sitio
        </h1>

        <div className="space-y-6">
          {/* Card de Mantenimiento */}
          <Card className="rounded-[40px] shadow-sm border-none bg-white overflow-hidden">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/10 pb-8">
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                <Construction className="w-5 h-5" />
                Modo Mantenimiento
              </CardTitle>
              <CardDescription>Cuando esté activo, los clientes verán una página de "Pausa Creativa". Tú seguirás teniendo acceso al panel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="flex items-center justify-between p-6 bg-yellow-50/50 rounded-3xl border border-yellow-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Activar Mantenimiento</Label>
                  <p className="text-xs text-muted-foreground">Ocultar el catálogo temporalmente.</p>
                </div>
                <Switch 
                  checked={maintenanceMode} 
                  onCheckedChange={setMaintenanceMode}
                  className="data-[state=checked]:bg-yellow-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card de Identidad Visual */}
          <Card className="rounded-[40px] shadow-sm border-none bg-white overflow-hidden">
            <CardHeader className="bg-accent/5 pb-8">
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-accent" />
                Logotipo y Tamaño
              </CardTitle>
              <CardDescription>Sube tu logo y utiliza el control deslizante para agrandarlo o achicarlo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Vista Previa del Logotipo</Label>
                <div className="h-32 w-full flex items-center justify-center bg-muted/30 rounded-3xl border-2 border-dashed border-muted relative overflow-hidden transition-all duration-300">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      style={{ height: `${logoHeight[0]}px` }}
                      className="w-auto object-contain transition-all duration-300 drop-shadow-md"
                    />
                  ) : (
                    <span className="text-2xl font-bold tracking-tighter text-primary/40">
                      BLANCO<span className="font-light text-accent/40">MANTECA</span>
                    </span>
                  )}
                  {logoUrl && (
                    <button onClick={() => setLogoUrl(null)} className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-full"><X className="w-3 h-3" /></button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-dashed" onClick={() => logoInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-2" /> Cambiar Logotipo
                </Button>
              </div>

              <div className="space-y-6 p-6 bg-accent/5 rounded-[2rem] border border-accent/10">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Tamaño del Logotipo</Label>
                  <span className="text-sm font-black text-accent bg-white px-3 py-1 rounded-full shadow-sm">{logoHeight[0]}px</span>
                </div>
                <Slider 
                  value={logoHeight} 
                  onValueChange={setLogoHeight} 
                  max={100} 
                  min={12} 
                  step={1} 
                  className="py-4" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] shadow-sm border-none bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Icono del Navegador (Favicon)
              </CardTitle>
              <CardDescription>El pequeño icono que aparece en la pestaña de tu navegador.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center border-2 border-dashed relative">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                  ) : (
                    <Globe className="w-6 h-6 text-muted-foreground/30" />
                  )}
                  {faviconUrl && (
                    <button onClick={() => setFaviconUrl(null)} className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full shadow-lg"><X className="w-2 h-2" /></button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Sube un icono cuadrado</p>
                  <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={handleFaviconChange} />
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => faviconInputRef.current?.click()}>
                    <Camera className="w-3 h-3 mr-2" /> Seleccionar Icono
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t p-6 flex justify-end gap-3">
              <Button variant="ghost" className="rounded-xl" onClick={resetAll}>
                <RotateCcw className="w-4 h-4 mr-2" /> Restaurar Todo
              </Button>
              <Button className="rounded-xl px-8 shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
