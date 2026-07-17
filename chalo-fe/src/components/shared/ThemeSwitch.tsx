"use client";
// src/components/shared/ThemeSwitch.tsx — sun/moon pill bound to the theme context

import { useTheme } from "@/providers/ThemeProvider";

export const ThemeSwitch = () => {
  const { resolvedTheme, changeTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Chế độ tối"
      data-testid="theme-switch"
      onClick={() => changeTheme(isDark ? "light" : "dark")}
      className={`relative h-8 w-16 shrink-0 overflow-hidden rounded-full border motion-safe:transition-colors motion-safe:duration-300 ${
        isDark
          ? "border-gray-700 bg-gradient-to-b from-gray-800 to-gray-950"
          : "border-sky-300 bg-gradient-to-b from-sky-300 to-sky-500"
      }`}
    >
      {/* Clouds — decorative, light only */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
          isDark ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="absolute bottom-1 right-2 h-2.5 w-5 rounded-full bg-white/80" />
        <span className="absolute bottom-2.5 right-4 size-2 rounded-full bg-white/60" />
      </span>

      {/* Stars — decorative, dark only */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
          isDark ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="absolute left-2 top-2 size-1 rounded-full bg-white/90" />
        <span className="absolute left-4 top-4 size-0.5 rounded-full bg-white/70" />
        <span className="absolute left-3 top-6 size-1 rounded-full bg-white/60" />
        <span className="absolute left-6 top-2.5 size-0.5 rounded-full bg-white/50" />
      </span>

      {/* Knob: sun or moon */}
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 size-6 rounded-full motion-safe:transition-transform motion-safe:duration-300 ${
          isDark
            ? "translate-x-8 bg-gray-300 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.35)]"
            : "translate-x-0 bg-amber-400 shadow-[0_0_10px_3px_rgba(251,191,36,0.65)]"
        }`}
      >
        {/* Craters — only meaningful on the moon */}
        <span
          className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="absolute left-1 top-1.5 size-1.5 rounded-full bg-gray-400/70" />
          <span className="absolute right-1.5 top-3 size-1 rounded-full bg-gray-400/60" />
          <span className="absolute bottom-1 left-2.5 size-1 rounded-full bg-gray-400/50" />
        </span>
      </span>
    </button>
  );
};
