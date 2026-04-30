import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { canStartVoiceJob, getVoiceDecodeConfig } from "@/lib/voz/feature-flag";

// POST /api/voz/audio/upload
// Multipart form: { audio: File, userId: string }
// Recebe o arquivo, valida, salva no bucket Supabase Storage 'voz-audios',
// cria row em voz_jobs (status='uploaded') e retorna { jobId }.
//
// O processamento real (Whisper + Claude) acontece em /api/voz/audio/process/[id].
// Separar evita estourar timeout em uploads grandes + da visibilidade de progresso.

export const runtime = "nodejs"; // FormData parsing precisa do node runtime
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const config = getVoiceDecodeConfig();

    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }
    if (!audio) {
      return NextResponse.json({ error: "audio obrigatorio" }, { status: 400 });
    }

    // Valida tamanho
    const sizeMb = audio.size / (1024 * 1024);
    if (sizeMb > config.maxAudioMb) {
      return NextResponse.json(
        {
          error: `Audio maior que ${config.maxAudioMb}MB. Tamanho: ${sizeMb.toFixed(1)}MB.`,
        },
        { status: 413 }
      );
    }

    // Valida feature flag + limites
    const check = await canStartVoiceJob(userId);
    if (!check.allowed) {
      const msg =
        check.reason === "disabled"
          ? "Decodificacao por voz esta desativada no momento."
          : check.reason === "user_limit"
          ? `Voce ja usou suas ${config.limitPerUser} analises por voz.`
          : `Limite diario do sistema atingido. Tente novamente amanha.`;
      return NextResponse.json(
        { error: msg, code: check.reason, ...check.used },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    // 1. Cria job (status='uploaded' temporariamente — confirma apos upload)
    const { data: job, error: jobErr } = await supabase
      .from("voz_jobs")
      .insert({
        user_id: userId,
        status: "uploaded",
        audio_size: audio.size,
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      console.error("Voz upload — falha criar job:", jobErr);
      return NextResponse.json({ error: "Falha ao criar job" }, { status: 500 });
    }

    // 2. Faz upload do audio pro bucket
    const ext = guessExt(audio.type, audio.name);
    const path = `${userId}/${job.id}${ext}`;

    const arrayBuffer = await audio.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("voz-audios")
      .upload(path, arrayBuffer, {
        contentType: audio.type || "audio/webm",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Voz upload — falha storage:", uploadErr);
      // Reverte: deleta o job criado
      await supabase.from("voz_jobs").delete().eq("id", job.id);
      return NextResponse.json(
        { error: `Falha no upload: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    // 3. Atualiza o path no job
    await supabase
      .from("voz_jobs")
      .update({ audio_path: path })
      .eq("id", job.id);

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error("Voz upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

function guessExt(mime: string, filename: string): string {
  const fromName = (filename || "").match(/\.(\w{2,4})$/);
  if (fromName) return `.${fromName[1].toLowerCase()}`;
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return ".m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return ".mp3";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("ogg")) return ".ogg";
  return ".webm";
}
