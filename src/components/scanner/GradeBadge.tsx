import { GRADE_THRESHOLDS, type Grade } from "@/types/grade";

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-xl",
  lg: "h-20 w-20 text-4xl",
};

export function GradeBadge({
  grade,
  size = "md",
}: {
  grade: Grade | string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!grade) {
    return (
      <div
        className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] font-mono font-bold text-[var(--text-tertiary)]`}
      >
        ?
      </div>
    );
  }

  const info = GRADE_THRESHOLDS[grade as Grade] ?? GRADE_THRESHOLDS.F;
  const isF = grade === "F";

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full font-mono font-bold transition-shadow ${isF ? "animate-pulse-glow" : ""}`}
      style={{
        backgroundColor: `${info.color}15`,
        color: info.color,
        boxShadow: `0 0 16px ${info.color}35`,
        ...(isF ? { "--glow-color": "#ef4444" } as React.CSSProperties : {}),
      }}
      title={`Grade ${grade}: ${info.label}`}
    >
      {grade}
    </div>
  );
}
