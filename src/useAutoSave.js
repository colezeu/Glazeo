import { useEffect, useRef } from "react";

/**
 * Hook simplu: salvează automat un obiect de stare în localStorage.
 * Folosește același prefix `ga_` ca usePersistedConfig.
 * 
 * @param {string} key - cheia localStorage (ex: "terrace")
 * @param {object} state - obiectul de stare de salvat
 */
export function useAutoSave(key, state) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state || Object.keys(state).length === 0) return;

    // Debounce: salvează la 1 secundă după ultima schimbare
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const toSave = { ...state, _savedAt: Date.now() };
        localStorage.setItem(`ga_${key}`, JSON.stringify(toSave));
      } catch {}
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, JSON.stringify(state)]);
}
