import { NextResponse } from "next/server";

import { isRegistrationClosed } from "@/lib/admin/registration";
import { getVoiceDecodeConfig } from "@/lib/voz/feature-flag";

// GET /api/config
// Retorna config publica do sistema. Usado pelo frontend pra adaptar UI
// (ex: mostrar "cadastros fechados", esconder botao de audio se desativado).
//
// Cache curto (60s) na CDN — nao precisa ser real-time.
export async function GET() {
  const voice = getVoiceDecodeConfig();
  return NextResponse.json(
    {
      registrationClosed: isRegistrationClosed(),
      voiceDecode: {
        enabled: voice.enabled,
        limitPerUser: voice.limitPerUser,
        maxAudioMb: voice.maxAudioMb,
        maxDurationS: voice.maxDurationS,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
