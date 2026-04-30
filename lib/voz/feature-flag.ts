// Feature flag pra decodificacao de voz por audio.
// Permite ligar/desligar globalmente, limitar por user e ter kill-switch diario.
//
// Env vars (todas opcionais com defaults seguros):
//   VOICE_DECODE_ENABLED          → 'true' liga; qualquer outra coisa desliga (default: false)
//   VOICE_DECODE_LIMIT_PER_USER   → numero (default 3)
//   VOICE_DECODE_DAILY_LIMIT      → numero (default 20)
//   VOICE_DECODE_MAX_AUDIO_MB     → numero (default 25)
//   VOICE_DECODE_MAX_DURATION_S   → numero (default 600 = 10 min)

import { createClient } from "@/lib/supabase/server";

export const VOICE_DECODE_DEFAULTS = {
  ENABLED: false,
  LIMIT_PER_USER: 3,
  DAILY_LIMIT: 20,
  MAX_AUDIO_MB: 25,
  MAX_DURATION_S: 600,
};

export type VoiceDecodeConfig = {
  enabled: boolean;
  limitPerUser: number;
  dailyLimit: number;
  maxAudioMb: number;
  maxDurationS: number;
};

export function getVoiceDecodeConfig(): VoiceDecodeConfig {
  return {
    enabled: process.env.VOICE_DECODE_ENABLED === "true",
    limitPerUser: parseInt(
      process.env.VOICE_DECODE_LIMIT_PER_USER || "",
      10
    ) || VOICE_DECODE_DEFAULTS.LIMIT_PER_USER,
    dailyLimit: parseInt(process.env.VOICE_DECODE_DAILY_LIMIT || "", 10) ||
      VOICE_DECODE_DEFAULTS.DAILY_LIMIT,
    maxAudioMb: parseInt(process.env.VOICE_DECODE_MAX_AUDIO_MB || "", 10) ||
      VOICE_DECODE_DEFAULTS.MAX_AUDIO_MB,
    maxDurationS: parseInt(process.env.VOICE_DECODE_MAX_DURATION_S || "", 10) ||
      VOICE_DECODE_DEFAULTS.MAX_DURATION_S,
  };
}

/**
 * Verifica se o user pode iniciar mais um job de voz hoje.
 * Aplica 3 checagens: enabled, limit per user, daily global.
 */
export async function canStartVoiceJob(userId: string): Promise<{
  allowed: boolean;
  reason?: "disabled" | "user_limit" | "daily_limit";
  used?: { byUser: number; today: number };
  limits: VoiceDecodeConfig;
}> {
  const config = getVoiceDecodeConfig();

  if (!config.enabled) {
    return { allowed: false, reason: "disabled", limits: config };
  }

  const supabase = await createClient();

  // Quantos jobs esse user ja teve no total (lifetime)
  const { count: byUserCount } = await supabase
    .from("voz_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed"); // failed nao conta no limite

  const byUser = byUserCount ?? 0;

  if (byUser >= config.limitPerUser) {
    return {
      allowed: false,
      reason: "user_limit",
      used: { byUser, today: 0 },
      limits: config,
    };
  }

  // Quantos jobs hoje (todos users)
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("voz_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart.toISOString())
    .neq("status", "failed");

  const today = todayCount ?? 0;

  if (today >= config.dailyLimit) {
    return {
      allowed: false,
      reason: "daily_limit",
      used: { byUser, today },
      limits: config,
    };
  }

  return { allowed: true, used: { byUser, today }, limits: config };
}
