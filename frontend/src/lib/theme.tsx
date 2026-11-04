import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * poolr theme engine — class-based light/dark with persistence.
 * Tailwind v4 reads `dark:` variants from this exact selector
 * (`&:where(.dark, .dark *)` in index.css), so toggling `.dark` on <html>
 * flips every themed surface app-wide.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "poolr.theme";
function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const DEFAULT_THEME: Theme = systemTheme();

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Convenience used by SwitchButton-style toggles. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Keep native form controls / scrollbars consistent with the theme.
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStored() ?? DEFAULT_THEME);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — theme still applies for the session */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// oxlint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
