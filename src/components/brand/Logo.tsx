const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
};

export function Logo({
  size = "md",
  showText = false,
  animate = false,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animate?: boolean;
}) {
  const px = sizes[size];

  return (
    <span className="inline-flex items-center gap-2">
      <LogoIcon size={size} animate={animate} />
      {showText && (
        <span
          className="font-display font-bold tracking-tight text-[var(--text-primary)]"
          style={{ fontSize: px * 0.65 }}
        >
          MCP Scanner
        </span>
      )}
    </span>
  );
}

export function LogoIcon({
  size = "md",
  animate = false,
}: {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}) {
  const px = sizes[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Shield body */}
      <path
        d="M24 4L8 12v10c0 11 6.8 21.2 16 24 9.2-2.8 16-13 16-24V12L24 4z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner shield highlight */}
      <path
        d="M24 10L13 16v7c0 8 5 15.4 11 17.4 6-2 11-9.4 11-17.4v-7L24 10z"
        fill="var(--accent)"
        fillOpacity="0.06"
      />
      {/* Scan line */}
      <line
        x1="14"
        y1="24"
        x2="34"
        y2="24"
        stroke="var(--accent-glow)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={animate ? undefined : "0.4"}
      >
        {animate && (
          <animate
            attributeName="y1"
            values="16;32;16"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
        {animate && (
          <animate
            attributeName="y2"
            values="16;32;16"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
        {animate && (
          <animate
            attributeName="opacity"
            values="0.2;0.7;0.2"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </line>
      {/* Checkmark */}
      <path
        d="M18 24l4 4 8-8"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
