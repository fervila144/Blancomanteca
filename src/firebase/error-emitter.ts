'use client';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the shape of all possible events and their corresponding payload types.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

type Callback<T> = (data: T) => void;

/**
 * A strongly-typed pub/sub event emitter.
 */
function createEventEmitter<T extends Record<string, any>>() {
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  const off = <K extends keyof T>(eventName: K, callback: Callback<T[K]>) => {
    if (!events[eventName]) {
      return;
    }
    events[eventName] = events[eventName]?.filter(cb => cb !== callback);
  };

  const on = <K extends keyof T>(eventName: K, callback: Callback<T[K]>) => {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName]?.push(callback);
    // Return an unsubscribe function
    return () => off(eventName, callback);
  };

  const emit = <K extends keyof T>(eventName: K, data: T[K]) => {
    if (!events[eventName]) {
      return;
    }
    events[eventName]?.forEach(callback => callback(data));
  };

  return { on, off, emit };
}

export const errorEmitter = createEventEmitter<AppEvents>();
