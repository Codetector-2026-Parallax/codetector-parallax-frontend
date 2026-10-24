export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'cp_theme';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota errors
  }
}

/**
 * Cross-tab / cross-window theme synchronization listener
 */
export function initThemeSync(onThemeChange?: (theme: ThemeMode) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
      onThemeChange?.(e.newValue);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
