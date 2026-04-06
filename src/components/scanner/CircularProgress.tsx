"use client";

import { useEffect, useState } from "react";
import { GRADE_THRESHOLDS, type Grade } from "@/types/grade";

export function CircularProgress({
  score,
  grade,
  size = 120,
}: {
  score: number;
  grade: string;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = GRADE_THRESHOLDS[grade as Grade]?.color ?? "#64748b";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="drop-shadow-lg"
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${grade}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth="8"
      />
      {/* Progress arc */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={mounted ? targetOffset : circumference}
        transform="rotate(-90 60 60)"
        filter={`url(#glow-${grade})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
      {/* Score number */}
      <text
        x="60"
        y="52"
        textAnchor="middle"
        fill={color}
        fontSize="28"
        fontWeight="bold"
        fontFamily="'Geist Mono', monospace"
      >
        {score}
      </text>
      {/* Grade letter */}
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fill="#a1a1a1"
        fontSize="14"
        fontWeight="500"
        fontFamily="'Geist Mono', monospace"
      >
        {grade}
      </text>
    </svg>
  );
}
