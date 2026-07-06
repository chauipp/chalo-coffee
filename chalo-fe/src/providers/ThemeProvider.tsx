'use client'
// src/providers/ThemeProvider.tsx
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "system" | "light" | "dark";

const THEME_KEY = "chalo-theme";

interface ThemeCtx {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  changeTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must used in ThemeProvider");
  return c;
};

export const getResolvedTheme = (t: Theme): 'light' | 'dark' => {
  if (t !== 'system') return t
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(()=>getResolvedTheme(theme));

  useEffect(() => {
    const apply = (th: "light" | "dark") => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(th);
      root.style.colorScheme = th;
      setResolvedTheme(th);
    };
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) =>
        apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    apply(theme);
  }, [theme]);

  const changeTheme = (t: Theme) => {
    setTheme(t);
    if(t==='system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, t);
  };

  return <Ctx value={{ theme, resolvedTheme, changeTheme }}>{children}</Ctx>;
};

export const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{
        var t=localStorage.getItem('${THEME_KEY}')||'system'
        var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t
        document.documentElement.classList.add(r)
        document.documentElement.style.colorScheme=r
      }catch(e){}}())`,
    }}
  />
);
