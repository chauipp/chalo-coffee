"use client";
// src/components/shared/ConfettiBurst.tsx — hiệu ứng ăn mừng nhỏ, tắt hẳn khi prefers-reduced-motion
import { useEffect, useState } from "react";

const PARTICLE_COUNT = 8;
const COLORS = [
  "var(--color-pop-500)",
  "var(--color-pop-400)",
  "var(--color-brand-300)",
  "var(--color-pop-600)",
];

interface Particle {
  id: number;
  angle: number;
  color: string;
}

const buildParticles = (triggerKey: number): Particle[] =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: triggerKey * 100 + i,
    angle: (360 / PARTICLE_COUNT) * i,
    color: COLORS[i % COLORS.length],
  }));

export const ConfettiBurst = ({ triggerKey }: { triggerKey: number }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [firedKey, setFiredKey] = useState<number>(0);

  // Adjust state during render (same pattern as ServiceStepper.Playful.tsx)
  // instead of a synchronous setState-in-effect, to satisfy
  // react-hooks/set-state-in-effect.
  if (triggerKey !== firedKey && triggerKey !== 0) {
    setFiredKey(triggerKey);
    setParticles(buildParticles(triggerKey));
  }

  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => setParticles([]), 600);
    return () => clearTimeout(timer);
  }, [particles]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-full motion-safe:animate-[confetti-burst_0.55s_ease-out_forwards]"
          style={
            {
              backgroundColor: p.color,
              "--confetti-angle": `${p.angle}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
