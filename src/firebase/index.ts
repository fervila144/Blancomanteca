'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Singleton de servicios de Firebase para evitar el error CA9 en Next.js.
 * Almacenamos las instancias en globalThis para que sobrevivan a las recargas de HMR.
 */
const _global = globalThis as any;

export function initializeFirebase() {
  // Evitar ejecución en el lado del servidor para prevenir errores de hidratación
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    // Inicializar la App si no existe ninguna
    if (!_global.__FB_APP__) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        _global.__FB_APP__ = existingApps[0];
      } else {
        _global.__FB_APP__ = initializeApp(firebaseConfig);
      }
    }

    // Inicializar Auth solo una vez
    if (!_global.__FB_AUTH__) {
      _global.__FB_AUTH__ = getAuth(_global.__FB_APP__);
    }

    // Inicializar Firestore solo una vez (aquí es donde solía ocurrir el error ca9)
    if (!_global.__FB_DB__) {
      _global.__FB_DB__ = getFirestore(_global.__FB_APP__);
    }

    return {
      firebaseApp: _global.__FB_APP__ as FirebaseApp,
      auth: _global.__FB_AUTH__ as Auth,
      firestore: _global.__FB_DB__ as Firestore,
    };
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    // Fallback seguro en caso de error crítico
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
