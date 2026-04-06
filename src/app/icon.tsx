import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366F1, #0EA5E9)",
          borderRadius: "6px",
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path
            d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"
            fill="white"
            opacity="0.9"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
