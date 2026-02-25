import { useEffect, useRef, useState } from 'react';

interface Props {
  durationMs: number;
  remainingMs?: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularTimer({
  durationMs,
  remainingMs,
  size = 80,
  strokeWidth = 6,
}: Props) {
  const [fraction, setFraction] = useState(1);
  const [seconds, setSeconds] = useState(Math.ceil(durationMs / 1000));
  const endTimeRef = useRef(Date.now() + durationMs);
  const rafRef = useRef(0);

  useEffect(() => {
    endTimeRef.current = Date.now() + (remainingMs ?? durationMs);
  }, [remainingMs, durationMs]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const frac = Math.min(1, remaining / durationMs);
      setFraction(frac);
      setSeconds(Math.ceil(remaining / 1000));
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [durationMs]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  const color = fraction > 0.33 ? 'var(--jeopardy-gold)' : 'var(--incorrect-red)';

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke 0.3s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.3}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {seconds}
      </text>
    </svg>
  );
}
