import { ImageResponse } from "next/og";

// Favicon dinamico — monograma do iAbdo.
// Next.js 13+ usa esse arquivo automaticamente como <link rel="icon">.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          letterSpacing: "-0.05em",
        }}
      >
        iA
      </div>
    ),
    {
      ...size,
    }
  );
}
