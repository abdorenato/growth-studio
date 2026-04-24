/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

// Conjugação da 1ª pessoa do presente pra capa (verbo no infinitivo → "eu faço")
const IRREGULARES: Record<string, string> = {
  fazer: "faço",
  dizer: "digo",
  trazer: "trago",
  ver: "vejo",
  vir: "venho",
  ter: "tenho",
  ler: "leio",
  crer: "creio",
  ir: "vou",
  ser: "sou",
  estar: "estou",
  dar: "dou",
  saber: "sei",
  poder: "posso",
  querer: "quero",
  ouvir: "ouço",
  pedir: "peço",
  medir: "meço",
  servir: "sirvo",
  sentir: "sinto",
  cobrir: "cubro",
  dormir: "durmo",
  perder: "perco",
  caber: "caibo",
  pôr: "ponho",
  por: "ponho",
};

function primeiraPessoa(frase: string): string {
  const trimmed = frase.trim();
  if (!trimmed) return frase;
  const [primeira, ...resto] = trimmed.split(/\s+/);
  if (!primeira) return frase;
  const lower = primeira.toLowerCase().replace(/[.,;!?]$/, "");

  let conjugado: string | null = null;

  if (IRREGULARES[lower]) {
    conjugado = IRREGULARES[lower];
  } else if (/^[a-záéíóúâêôãõç]+(ar|er|ir)$/i.test(lower)) {
    const radical = lower.slice(0, -2);
    conjugado = radical + "o";
  }

  if (!conjugado) return frase;

  // Preserva capitalização da primeira letra
  const isUpper = primeira[0] === primeira[0].toUpperCase();
  const finalWord = isUpper
    ? conjugado[0].toUpperCase() + conjugado.slice(1)
    : conjugado;

  return [finalWord, ...resto].join(" ");
}

const LENTE_COLORS: Record<string, { accent: string; name: string; icon: string }> = {
  analitica: { accent: "#4FC3F7", name: "Analítica", icon: "🧠" },
  humana: { accent: "#F472B6", name: "Humana", icon: "❤️" },
  provocadora: { accent: "#FBBF24", name: "Provocadora", icon: "⚡" },
  pratica: { accent: "#34D399", name: "Prática", icon: "🎯" },
  visionaria: { accent: "#A855F7", name: "Visionária", icon: "🔮" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tema = searchParams.get("tema") || "";
  const lente = searchParams.get("lente") || "analitica";
  const manifesto = searchParams.get("manifesto") || "";
  const fronteirasRaw = searchParams.get("fronteiras") || "[]";
  const handle = searchParams.get("handle") || "";
  const resultado = searchParams.get("resultado") || ""; // vem do posicionamento
  const slide = Number(searchParams.get("slide") || "0");

  let fronteiras: string[] = [];
  try {
    fronteiras = JSON.parse(fronteirasRaw).filter((f: string) => f?.trim());
  } catch {
    fronteiras = [];
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
          {slide === 0 && (
            <CapaSlide tema={tema} resultado={resultado} accent={l.accent} />
          )}
          {slide === 1 && <ManifestoSlide manifesto={manifesto} accent={l.accent} />}
          {slide === 2 && (
            <FronteirasSlide fronteiras={fronteiras} accent={l.accent} />
          )}
          {slide === 3 && <CtaSlide tema={tema} accent={l.accent} />}

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

function CapaSlide({
  tema,
  resultado,
  accent,
}: {
  tema: string;
  resultado: string;
  accent: string;
}) {
  // Se tem resultado (vem do posicionamento), usa como frase de ação principal.
  // Conjuga o verbo inicial pra 1ª pessoa: "Validar se..." → "Valido se..."
  // Senão, cai pro tema como fallback.
  const fraseBase = resultado?.trim() || tema;
  const frasePrincipal = resultado?.trim() ? primeiraPessoa(fraseBase) : fraseBase;
  const showTemaTag = Boolean(resultado?.trim() && tema?.trim());

  // Tamanho da fonte se ajusta conforme comprimento (pra não estourar)
  const fs =
    frasePrincipal.length > 80 ? 68 : frasePrincipal.length > 45 ? 80 : 92;

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
          fontSize: fs,
          color: "#ffffff",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
        }}
      >
        {frasePrincipal}
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
      {showTemaTag && (
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: accent,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {tema}
        </div>
      )}
    </div>
  );
}

function ManifestoSlide({
  manifesto,
  accent,
}: {
  manifesto: string;
  accent: string;
}) {
  const fs =
    manifesto.length > 110 ? 52 : manifesto.length > 70 ? 62 : 76;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 80,
          color: accent,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          display: "flex",
          fontSize: fs,
          color: "#ffffff",
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        {manifesto}
      </div>
    </div>
  );
}

function FronteirasSlide({
  fronteiras,
  accent,
}: {
  fronteiras: string[];
  accent: string;
}) {
  const items = fronteiras.slice(0, 4);
  // Ajusta o tamanho do texto conforme quantidade pra não estourar
  const fs = items.length <= 2 ? 42 : items.length === 3 ? 36 : 30;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 500,
          }}
        >
          Aqui NÃO tem
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            color: "#ffffff",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          espaço pra
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: "100%",
        }}
      >
        {items.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: fs,
              color: "#ffffff",
              fontWeight: 700,
              lineHeight: 1.2,
              paddingLeft: 14,
              borderLeft: `6px solid ${accent}`,
            }}
          >
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaSlide({ tema, accent }: { tema: string; accent: string }) {
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
        É sobre {tema.toLowerCase()} que eu quero
        continuar a conversa com você.
      </div>
    </div>
  );
}
