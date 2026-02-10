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
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          style={{ position: "absolute" }}
        >
          <path
            d="M16 0 L32 8 L32 24 L16 32 L0 24 L0 8 Z"
            fill="#5b6cf2"
          />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "white",
          }}
        >
          PF
        </span>
      </div>
    ),
    { ...size }
  );
}
