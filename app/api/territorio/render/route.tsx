/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

const LENTE_COLORS: Record<string, { accent: string; name: string; icon: string }> = {
  analitica: { accent: "#4FC3F7", name: "Analítica", icon: "🧠" },
  humana: { accent: "#F472B6", name: "Humana", icon: "❤️" },
  provocadora: { accent: "#FBBF24", name: "Provocadora", icon: "⚡" },
  pratica: { accent: "#34D399", name: "Prática", icon: "🎯" },
  visionaria: { accent: "#A855F7", name: "Visionária", icon: "🔮" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ancora = searchParams.get("ancora") || searchParams.get("tema") || "";
  const lente = searchParams.get("lente") || "analitica";
  const tese = searchParams.get("tese") || searchParams.get("manifesto") || "";
  const expansao = searchParams.get("expansao") || "";
  const negativasRaw = searchParams.get("negativas") || searchParams.get("fronteiras") || "[]";
  const positivasRaw = searchParams.get("positivas") || "[]";
  const handle = searchParams.get("handle") || "";
  const slide = Number(searchParams.get("slide") || "0");

  let negativas: string[] = [];
  let positivas: string[] = [];
  try {
    negativas = JSON.parse(negativasRaw).filter((f: string) => f?.trim());
  } catch {
    negativas = [];
  }
  try {
    positivas = JSON.parse(positivasRaw).filter((f: string) => f?.trim());
  } catch {
    positivas = [];
  }

  const l = LENTE_COLORS[lente] || LENTE_COLORS.analitica;
  const total = 4;

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
            padding: "70px 70px",
            position: "relative",
          }}
        >
          {/* Orbes decorativos */}
          <div
            style={{
              position: "absolute",
              top: -180,
              right: -130,
              width: 500,
              height: 500,
              borderRadius: 500,
              background: `radial-gradient(circle, ${l.accent}55 0%, transparent 70%)`,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -200,
              left: -160,
              width: 600,
              height: 600,
              borderRadius: 600,
              background: `radial-gradient(circle, ${l.accent}33 0%, transparent 70%)`,
              display: "flex",
            }}
          />

          {/* Header discreto: só contador */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "rgba(255,255,255,0.45)",
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              {slide + 1} / {total}
            </div>
          </div>

          {/* Conteúdo específico do slide */}
          {slide === 0 && <AncoraSlide ancora={ancora} accent={l.accent} />}
          {slide === 1 && (
            <ManifestoSlide tese={tese} expansao={expansao} accent={l.accent} />
          )}
          {slide === 2 && (
            <FronteirasSlide
              negativas={negativas}
              positivas={positivas}
              accent={l.accent}
            />
          )}
          {slide === 3 && <CtaSlide ancora={ancora} accent={l.accent} />}

          {/* Footer com @ */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: 20,
              fontSize: 22,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {handle ? `@${handle}` : ""}
          </div>
        </div>
      ),
      { width: 1080, height: 1350 }
    );
  } catch (err) {
    console.error("Render territorio error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Slides ────────────────────────────────────────────────────────────────

function AncoraSlide({ ancora, accent }: { ancora: string; accent: string }) {
  // Âncora mental é curta (1-3 palavras) — fonte BEM grande
  const fs = ancora.length > 25 ? 100 : ancora.length > 15 ? 130 : 160;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Meu território
      </div>
      <div
        style={{
          display: "flex",
          fontSize: fs,
          color: "#ffffff",
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
        }}
      >
        {ancora}
      </div>
      <div
        style={{
          display: "flex",
          width: 120,
          height: 6,
          background: accent,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

function ManifestoSlide({
  tese,
  expansao,
  accent,
}: {
  tese: string;
  expansao: string;
  accent: string;
}) {
  const teseFs = tese.length > 80 ? 56 : tese.length > 50 ? 68 : 80;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 30,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 70,
          color: accent,
          fontWeight: 900,
          lineHeight: 0.8,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          display: "flex",
          fontSize: teseFs,
          color: "#ffffff",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {tese}
      </div>
      {expansao ? (
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            lineHeight: 1.3,
            paddingLeft: 24,
            borderLeft: `4px solid ${accent}`,
          }}
        >
          {expansao}
        </div>
      ) : null}
    </div>
  );
}

function FronteirasSlide({
  negativas,
  positivas,
  accent,
}: {
  negativas: string[];
  positivas: string[];
  accent: string;
}) {
  const neg = negativas.slice(0, 4);
  const pos = positivas.slice(0, 4);
  const max = Math.max(neg.length, pos.length);
  const fs = max <= 2 ? 28 : max === 3 ? 24 : 20;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 48,
          color: "#ffffff",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        Como eu opero
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
        }}
      >
        {/* Coluna negativas */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#ef4444",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            🚫 Não faço
          </div>
          {neg.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontSize: fs,
                color: "#ffffff",
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Coluna positivas */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: accent,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ✅ Faço
          </div>
          {pos.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontSize: fs,
                color: "#ffffff",
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaSlide({ ancora, accent }: { ancora: string; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 36,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          color: "#ffffff",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        Se isso faz sentido pra você,
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          color: accent,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        me segue.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32,
          color: "rgba(255,255,255,0.6)",
          fontWeight: 500,
          lineHeight: 1.3,
          marginTop: 20,
        }}
      >
        Quero continuar a conversa sobre &ldquo;{ancora}&rdquo;.
      </div>
    </div>
  );
}
