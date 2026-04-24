/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const icp = searchParams.get("icp") || "";
  const resultado = searchParams.get("resultado") || "";
  const mecanismoNome = searchParams.get("mecanismoNome") || "";
  const mecanismoDescricao = searchParams.get("mecanismoDescricao") || "";
  const diferencial = searchParams.get("diferencial") || "";
  const handle = searchParams.get("handle") || "";

  const mecanismoFinal = mecanismoNome
    ? mecanismoDescricao
      ? `${mecanismoNome} — ${mecanismoDescricao}`
      : mecanismoNome
    : mecanismoDescricao;

  // Monta texto como blocos (linha por linha) para controlar o layout
  const blocks = [
    { text: "Eu ajudo", color: "#ffffff" },
    { text: icp, color: "#4FC3F7" },
    { text: "a", color: "#ffffff" },
    { text: resultado, color: "#4FC3F7" },
    { text: "através de", color: "#ffffff" },
    { text: mecanismoFinal || "—", color: "#A855F7" },
    { text: "e me diferencio porque", color: "#ffffff" },
    { text: diferencial, color: "#FBBF24" },
  ];

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(145deg, #0a0a14 0%, #121226 45%, #1a1a3a 100%)",
            padding: "80px 80px",
            position: "relative",
          }}
        >
          {/* Orbes decorativos */}
          <div
            style={{
              position: "absolute",
              top: -200,
              right: -150,
              width: 600,
              height: 600,
              borderRadius: 600,
              background:
                "radial-gradient(circle, rgba(79, 195, 247, 0.32) 0%, rgba(79, 195, 247, 0) 70%)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -220,
              left: -180,
              width: 700,
              height: 700,
              borderRadius: 700,
              background:
                "radial-gradient(circle, rgba(168, 85, 247, 0.26) 0%, rgba(168, 85, 247, 0) 70%)",
              display: "flex",
            }}
          />

          {/* Kicker topo */}
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#4FC3F7",
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Posicionamento
          </div>

          {/* Conteúdo centralizado verticalmente */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {blocks.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  fontSize: b.color === "#ffffff" ? 40 : 56,
                  color: b.color,
                  fontWeight: b.color === "#ffffff" ? 400 : 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  textAlign: "left",
                }}
              >
                {b.text}
              </div>
            ))}
          </div>

          {/* @ no rodapé */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: 40,
              fontSize: 28,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {handle ? `@${handle}` : ""}
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  } catch (err) {
    console.error("Render posicionamento error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
