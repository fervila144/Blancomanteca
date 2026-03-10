'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

/**
 * Escuchador global de errores de permisos de Firestore.
 * Proporciona feedback al usuario sin interrumpir el flujo.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      if (!error) return;

      const context = error?.context || {};
      const operation = context?.operation || 'operación';
      const path = context?.path || '';

      // Filtro para ignorar errores en comprobaciones silenciosas o automáticas
      const isSystemCheck = path.includes('stockers') || path.includes('settings/site');
      
      // Solo mostramos toast para errores críticos de escritura de usuario
      if (!isSystemCheck && ['create', 'update', 'delete', 'write'].includes(operation)) {
        toast({
          variant: 'destructive',
          title: 'Acción restringida',
          description: 'No tienes permisos suficientes para realizar esta acción.',
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Firestore Auth Check]', { path, operation });
      }
    };

    const unsubscribe = errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [toast]);

  return null;
}
