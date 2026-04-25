/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const declaracao = (searchParams.get("declaracao") || "").trim();
  const fraseApoio = (searchParams.get("fraseApoio") || "").trim();
  const handle = searchParams.get("handle") || "";

  // Tamanho da declaração se ajusta conforme comprimento (sem estourar)
  const decFs =
    declaracao.length > 130 ? 52 : declaracao.length > 80 ? 60 : 72;
  const apoioFs =
    fraseApoio.length > 140 ? 26 : fraseApoio.length > 80 ? 30 : 34;

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

          {/* Conteúdo centralizado verticalmente */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 60,
            }}
          >
            {/* Declaração principal */}
            <div
              style={{
                display: "flex",
                fontSize: decFs,
                color: "#ffffff",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              {declaracao || " "}
            </div>

            {/* Linha decorativa de separação */}
            <div
              style={{
                display: "flex",
                width: 100,
                height: 4,
                background: "#4FC3F7",
                borderRadius: 2,
              }}
            />

            {/* Frase de apoio */}
            {fraseApoio ? (
              <div
                style={{
                  display: "flex",
                  fontSize: apoioFs,
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 400,
                  lineHeight: 1.4,
                  letterSpacing: "-0.005em",
                }}
              >
                {fraseApoio}
              </div>
            ) : null}
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
