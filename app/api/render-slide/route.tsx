/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

function sanitize(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[✓✗×÷±≈∞→←↑↓]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getStyle(name: string) {
  switch (name) {
    case "light_minimal":
      return {
        bg: "linear-gradient(145deg, #FAFAF8 0%, #EEE 100%)",
        fg: "#1a1a1a",
        accent: "#1a1a1a",
      };
    case "gradient_pop":
      return {
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fg: "#ffffff",
        accent: "#ffd700",
      };
    case "dark_bold":
    default:
      return {
        bg: "linear-gradient(145deg, #0a0a14 0%, #1a1a3a 100%)",
        fg: "#ffffff",
        accent: "#FFD700",
      };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const headline = sanitize(searchParams.get("headline") || "Headline");
  const body = sanitize(searchParams.get("body") || "");
  const style = searchParams.get("style") || "dark_bold";
  const bg = searchParams.get("bg") || "";
  const textBox = searchParams.get("textBox") || "dark";

  const styles = getStyle(style);
  const hasBg = !!bg;

  const textColor =
    hasBg && textBox === "light" ? "#111" : styles.fg;

  const overlayBg =
    textBox === "light"
      ? "rgba(255,255,255,0.88)"
      : "rgba(0,0,0,0.55)";

  const headlineSize =
    headline.length > 80 ? 64 : headline.length > 45 ? 80 : 96;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: styles.bg,
            padding: 80,
            position: "relative",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* Imagem de fundo via <img> absoluto (evita bug do backgroundImage: url) */}
          {hasBg ? (
            <img
              src={bg}
              alt=""
              width={1080}
              height={1350}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : null}

          {/* Overlay escurecedor/clareador sobre a imagem */}
          {hasBg ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: overlayBg,
                display: "flex",
              }}
            />
          ) : null}

          {/* Conteúdo */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 28,
              maxWidth: 900,
              color: textColor,
              zIndex: 10,
            }}
          >
            {/* Barra de destaque */}
            <div
              style={{
                display: "flex",
                width: 80,
                height: 6,
                background: styles.accent,
                borderRadius: 4,
              }}
            />

            {/* Headline */}
            <div
              style={{
                display: "flex",
                fontSize: headlineSize,
                fontWeight: 900,
                lineHeight: 1.05,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
              }}
            >
              {headline}
            </div>

            {/* Body (só se tiver) */}
            {body ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  lineHeight: 1.3,
                  opacity: 0.9,
                }}
              >
                {body}
              </div>
            ) : null}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1350,
      }
    );
  } catch (err) {
    console.error("Render slide error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Erro ao renderizar",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
