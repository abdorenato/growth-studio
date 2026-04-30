import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeTranscription,
  transcribeAudio,
} from "@/lib/voz/audio-pipeline";

// POST /api/voz/audio/process/[id]
// Roda o pipeline completo no job:
//   1. baixa audio do Storage
//   2. Whisper -> transcricao  (~10-25s pra 5min de audio)
//   3. Claude analyze -> mapa_voz + insights  (~10-20s)
//   4. salva resultado, deleta audio do Storage (LGPD)
//
// Total esperado: 25-50s. Vercel PRO timeout: 60s. Margem ok pra audio <= 7min.

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Carrega job
  const { data: job, error: jobErr } = await supabase
    .from("voz_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job nao encontrado" }, { status: 404 });
  }

  // Idempotencia: se ja done, retorna direto
  if (job.status === "done" && job.resultado) {
    return NextResponse.json({
      status: "done",
      resultado: job.resultado,
      transcricao: job.transcricao,
    });
  }

  if (!job.audio_path) {
    return NextResponse.json(
      { error: "Job sem audio_path — upload incompleto" },
      { status: 400 }
    );
  }

  try {
    // ─── Etapa 1: TRANSCRICAO ───────────────────────────────────────
    let transcricao = job.transcricao as string | null;

    if (!transcricao) {
      await supabase
        .from("voz_jobs")
        .update({ status: "transcribing", updated_at: new Date().toISOString() })
        .eq("id", id);

      // Baixa audio do storage
      const { data: audioBlob, error: dlErr } = await supabase.storage
        .from("voz-audios")
        .download(job.audio_path);

      if (dlErr || !audioBlob) {
        throw new Error(`Falha ao baixar audio: ${dlErr?.message || "desconhecido"}`);
      }

      const filename = job.audio_path.split("/").pop() || "audio.webm";
      transcricao = await transcribeAudio(audioBlob, filename);

      if (!transcricao || transcricao.length < 30) {
        throw new Error("Transcricao muito curta (audio mudo ou ruidoso?)");
      }

      await supabase
        .from("voz_jobs")
        .update({
          status: "transcribed",
          transcricao,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    // ─── Etapa 2: ANALISE ─────────────────────────────────────────────
    await supabase
      .from("voz_jobs")
      .update({ status: "analyzing", updated_at: new Date().toISOString() })
      .eq("id", id);

    const resultado = await analyzeTranscription(transcricao, job.user_id);

    // ─── Etapa 3: SALVAR + DELETAR AUDIO (LGPD) ──────────────────────
    await supabase
      .from("voz_jobs")
      .update({
        status: "done",
        resultado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Delete async (nao bloqueia resposta)
    supabase.storage
      .from("voz-audios")
      .remove([job.audio_path])
      .then(({ error }) => {
        if (error) {
          console.warn(`Falha ao deletar audio ${job.audio_path}:`, error);
        }
      });

    // Tambem limpa audio_path do job pra refletir delecao
    await supabase
      .from("voz_jobs")
      .update({ audio_path: null })
      .eq("id", id);

    return NextResponse.json({ status: "done", resultado, transcricao });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`Voz process job ${id} failed:`, err);

    await supabase
      .from("voz_jobs")
      .update({
        status: "failed",
        error: errMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// GET /api/voz/audio/process/[id]
// Retorna status atual do job (pra polling se quiser, ou pra retomar).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("voz_jobs")
    .select("id, user_id, status, transcricao, resultado, error, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: "nao encontrado" }, { status: 404 });
  return NextResponse.json(job);
}
