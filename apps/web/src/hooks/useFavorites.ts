'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'climbzone-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  const persist = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  }, []);

  const addFavorite = useCallback((zoneId: string) => {
    setFavorites((prev) => {
      if (prev.includes(zoneId)) return prev;
      const updated = [...prev, zoneId];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const removeFavorite = useCallback((zoneId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== zoneId);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const toggleFavorite = useCallback((zoneId: string) => {
    if (favorites.includes(zoneId)) {
      removeFavorite(zoneId);
    } else {
      addFavorite(zoneId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((zoneId: string) => {
    return favorites.includes(zoneId);
  }, [favorites]);

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}




