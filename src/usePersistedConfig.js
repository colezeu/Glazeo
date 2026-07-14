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
    normalized[key] = coerceValue(value, defaultConfig[key]);
  }

  return normalized;
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
      return normalizeConfig(urlConfig, defaultConfig);
    }

    // 2. Încearcă localStorage
    try {
      const saved = localStorage.getItem(`ga_${key}`);
      if (saved) {
        return normalizeConfig(JSON.parse(saved), defaultConfig);
      }
    } catch {}

    // 3. Default
    return defaultConfig;
  });

  // Salvează în localStorage la fiecare schimbare
  useEffect(() => {
    try {
      localStorage.setItem(`ga_${key}`, JSON.stringify(config));
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
      localStorage.removeItem(`ga_${key}`);
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
