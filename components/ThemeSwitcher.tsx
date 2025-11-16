'use client';

import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[var(--radius-full)] p-1 shadow-[var(--shadow-sm)]">
      <button
        onClick={() => setTheme('light')}
        className={`
          flex items-center justify-center
          w-9 h-9
          rounded-[var(--radius-full)]
          transition-all duration-200
          ${theme === 'light' 
            ? 'bg-[var(--accent-color)] text-white scale-105' 
            : 'text-[var(--text-color-secondary)] hover:bg-[color-mix(in_srgb,var(--text-color)_10%,transparent)]'
          }
        `}
        aria-label="Set light theme"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`
          flex items-center justify-center
          w-9 h-9
          rounded-[var(--radius-full)]
          transition-all duration-200
          ${theme === 'dark' 
            ? 'bg-[var(--accent-color)] text-white scale-105' 
            : 'text-[var(--text-color-secondary)] hover:bg-[color-mix(in_srgb,var(--text-color)_10%,transparent)]'
          }
        `}
        aria-label="Set dark theme"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`
          flex items-center justify-center
          w-9 h-9
          rounded-[var(--radius-full)]
          transition-all duration-200
          ${theme === 'system' 
            ? 'bg-[var(--accent-color)] text-white scale-105' 
            : 'text-[var(--text-color-secondary)] hover:bg-[color-mix(in_srgb,var(--text-color)_10%,transparent)]'
          }
        `}
        aria-label="Set system theme"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      </button>
    </div>
  );
}

