import { useState, useEffect, useCallback } from "react";

function coerceValue(rawValue, defaultValue) {
  if (typeof defaultValue === "boolean") {
    if (rawValue === true || rawValue === "true") return true;
    if (rawValue === false || rawValue === "false") return false;
  }

  if (typeof defaultValue === "number") {
    const num = Number(rawValue);
    return Number.isFinite(num) ? num : defaultValue;
  }

  return rawValue;
}

function normalizeConfig(source, defaultConfig) {
  const normalized = { ...defaultConfig };

  for (const [key, value] of Object.entries(source || {})) {
    if (key === "_savedAt") continue; // nu face parte din config
    normalized[key] = coerceValue(value, defaultConfig[key]);
  }

  return normalized;
}

const META_KEY = "_glazeo_meta";

function getMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setMeta(updates) {
  try {
    const current = getMeta();
    localStorage.setItem(META_KEY, JSON.stringify({ ...current, ...updates }));
  } catch {}
}

/**
 * Verifică dacă există o configurație salvată pentru un configurator,
 * care nu a fost încărcată în sesiunea curentă.
 * Returnează { hasSaved, savedAt, productName } sau null.
 */
export function getSavedConfigMeta(key) {
  try {
    const raw = localStorage.getItem(`ga_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const meta = getMeta();
    const lastLoaded = meta[`loaded_${key}`];
    const savedAt = parsed._savedAt;

    // Dacă a fost deja încărcat în această sesiune, nu mai arăta bannerul
    if (lastLoaded && savedAt && lastLoaded >= savedAt) {
      return null;
    }

    return {
      hasSaved: true,
      savedAt: savedAt || null,
      productName: parsed._productName || null,
    };
  } catch {
    return null;
  }
}

/**
 * Marchează o configurație ca fiind încărcată în sesiunea curentă.
 */
export function markConfigLoaded(key) {
  setMeta({ [`loaded_${key}`]: Date.now() });
}

/**
 * Șterge configurația salvată pentru un configurator.
 */
export function clearSavedConfig(key) {
  try {
    localStorage.removeItem(`ga_${key}`);
    const meta = getMeta();
    delete meta[`loaded_${key}`];
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
}

/**
 * Hook pentru salvarea/restaurarea configurației din localStorage + URL params
 * @param {string} key - cheia unică pentru localStorage (ex: "balustrade-config")
 * @param {Object} defaultConfig - configurația implicită
 * @returns {[Object, Function, Function]} - [config, setConfig, resetConfig]
 */
export function usePersistedConfig(key, defaultConfig) {
  // Încearcă să restaureze din URL params, apoi localStorage, apoi default
  const [config, setConfigState] = useState(() => {
    if (typeof window === "undefined") {
      return defaultConfig;
    }

    // 1. Încearcă URL params
    const params = new URLSearchParams(window.location.search);
    const urlConfig = {};
    let hasUrlParams = false;
    for (const [k, v] of params.entries()) {
      if (k.startsWith("cfg_")) {
        urlConfig[k.slice(4)] = v;
        hasUrlParams = true;
      }
    }
    if (hasUrlParams) {
      const restored = normalizeConfig(urlConfig, defaultConfig);
      // Marchează ca încărcat
      markConfigLoaded(key);
      return restored;
    }

    // 2. Încearcă localStorage
    try {
      const saved = localStorage.getItem(`ga_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = normalizeConfig(parsed, defaultConfig);
        markConfigLoaded(key);
        return restored;
      }
    } catch {}

    // 3. Default
    return defaultConfig;
  });

  // Salvează în localStorage la fiecare schimbare
  useEffect(() => {
    try {
      const toSave = { ...config, _savedAt: Date.now() };
      localStorage.setItem(`ga_${key}`, JSON.stringify(toSave));
    } catch {}
  }, [key, config]);

  // Actualizează URL-ul cu configurația curentă
  const setConfig = useCallback((updater) => {
    setConfigState(prev => {
      const nextRaw = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      const next = normalizeConfig(nextRaw, defaultConfig);

      if (typeof window === "undefined") {
        return next;
      }

      // Update URL without reload
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          params.set(`cfg_${k}`, String(v));
        }
      });
      const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      window.history.replaceState(null, "", newUrl);
      return next;
    });
  }, []);

  // Resetare la default
  const resetConfig = useCallback(() => {
    setConfigState(defaultConfig);
    if (typeof window !== "undefined") {
      clearSavedConfig(key);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [key, defaultConfig]);

  return [config, setConfig, resetConfig];
}

/**
 * Generează un URL shareable cu configurația curentă
 */
export function getShareableUrl(config) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams();
  Object.entries(config).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) {
      params.set(`cfg_${k}`, String(v));
    }
  });
  return `${window.location.origin}${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
}
