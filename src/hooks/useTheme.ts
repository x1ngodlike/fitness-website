import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

const KEY_THEME = 'challenge-theme';

function getSystemPrefersLight(): boolean {
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY_THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch { /* ignore */ }
  return 'system';
}

function isLightActive(theme: Theme): boolean {
  if (theme === 'system') return getSystemPrefersLight();
  return theme === 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (isLightActive(theme)) {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(KEY_THEME, theme); } catch { /* ignore */ }
  }, [theme]);

  // 监听系统主题变化（仅 system 模式生效）
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme('system');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const cycle = () => {
    setTheme((t) => (t === 'dark' ? 'light' : t === 'light' ? 'system' : 'dark'));
  };

  return { theme, setTheme, cycle };
}
