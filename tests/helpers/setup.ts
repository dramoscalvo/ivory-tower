import '@testing-library/jest-dom/vitest'

// Node.js >=22 provides a native localStorage that lacks .clear() and conflicts
// with jsdom's implementation. Provide a spec-compliant in-memory Storage so
// tests can call getItem/setItem/removeItem/clear reliably.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.get(key) ?? null; },
    setItem(key: string, value: string) { store.set(key, String(value)); },
    removeItem(key: string) { store.delete(key); },
    key(index: number) { return [...store.keys()][index] ?? null; },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true });
}

// jsdom does not implement window.matchMedia. Provide a minimal stub so that
// code using prefers-color-scheme queries (e.g. useTheme) works in tests.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
