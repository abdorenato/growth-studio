import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// Tipo simplificado pra passar como parametro nos helpers (evita problemas de
// inferencia de tipo do Supabase nos generic chains).
type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

// GET /api/admin/stats?period=24h|7d|30d|all
//
// Retorna TODOS os dados que o dashboard precisa em 1 request.
// Auth via header x-admin-email (validado contra ADMIN_EMAILS).
//
// NAO faz cache — admin sempre quer dados frescos.

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "all") as
    | "24h"
    | "7d"
    | "30d"
    | "all";

  const periodCutoff = computeCutoff(period);
  const cutoff3h = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();

  // Query helper: count() com filtro opcional de tempo
  async function count(table: string, dateCol = "created_at", since?: string) {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (since) q = q.gte(dateCol, since);
    const { count: c } = await q;
    return c ?? 0;
  }

  async function countDistinctUsers(table: string, since?: string) {
    let q = supabase.from(table).select("user_id");
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    if (!data) return 0;
    const set = new Set(data.map((r: { user_id: string | null }) => r.user_id).filter(Boolean));
    return set.size;
  }

  // ─── OVERVIEW ────────────────────────────────────────────────────────
  const [totalUsers, leadsHoje, leads7d, leads30d, sessoesChat24h, totalConteudos] =
    await Promise.all([
      count("users"),
      count("users", "created_at", cutoff24h),
      count("users", "created_at", cutoff7d),
      count("users", "created_at", cutoff30d),
      count("chat_sessions", "last_active_at", cutoff24h),
      count("conteudos"),
    ]);

  // Origem + status (contagens globais — independem do limit dos leads_recentes)
  const { data: origemRows } = await supabase
    .from("users")
    .select("origem, access_status");
  const origem = {
    chat: 0,
    platform: 0,
    sem_origem: 0,
  };
  const usersByStatus = {
    pending: 0,
    approved: 0,
    blocked: 0,
    total: 0,
  };
  (origemRows || []).forEach((r: { origem: string | null; access_status: string | null }) => {
    if (r.origem === "chat") origem.chat++;
    else if (r.origem === "platform") origem.platform++;
    else origem.sem_origem++;

    const s = r.access_status || "pending";
    if (s === "approved") usersByStatus.approved++;
    else if (s === "blocked") usersByStatus.blocked++;
    else usersByStatus.pending++;
    usersByStatus.total++;
  });

  // ─── UTILIZACOES (3h e 24h) ─────────────────────────────────────────
  const [
    leads3h,
    leads24h,
    chatMsgs3h,
    chatMsgs24h,
    aiCalls3h,
    aiCalls24h,
  ] = await Promise.all([
    count("users", "created_at", cutoff3h),
    count("users", "created_at", cutoff24h),
    count("chat_messages", "created_at", cutoff3h),
    count("chat_messages", "created_at", cutoff24h),
    count("ai_calls", "created_at", cutoff3h),
    count("ai_calls", "created_at", cutoff24h),
  ]);

  // Modulos novos completados em janelas
  const moduleTables = [
    "vozes",
    "icps",
    "posicionamentos",
    "territorios",
    "editorias",
    "ideias",
    "conteudos",
    "ofertas",
    "pitches",
    "bios",
    "destaques",
  ];

  const [modulosNovos3h, modulosNovos24h] = await Promise.all([
    Promise.all(moduleTables.map((t) => count(t, "created_at", cutoff3h))).then(
      (arr) => arr.reduce((a, b) => a + b, 0)
    ),
    Promise.all(moduleTables.map((t) => count(t, "created_at", cutoff24h))).then(
      (arr) => arr.reduce((a, b) => a + b, 0)
    ),
  ]);

  // ─── FUNIL ───────────────────────────────────────────────────────────
  const funnelLabels: Array<{ key: string; label: string; table?: string }> = [
    { key: "users", label: "Entraram" },
    { key: "vozes", label: "Voz da Marca", table: "vozes" },
    { key: "icps", label: "ICP", table: "icps" },
    { key: "posicionamentos", label: "Posicionamento", table: "posicionamentos" },
    { key: "territorios", label: "Território", table: "territorios" },
    { key: "editorias", label: "Editorias", table: "editorias" },
    { key: "ideias", label: "Ideias", table: "ideias" },
    { key: "conteudos", label: "Conteúdos", table: "conteudos" },
    { key: "ofertas", label: "Oferta", table: "ofertas" },
    { key: "pitches", label: "Pitch", table: "pitches" },
    { key: "bios", label: "Bio", table: "bios" },
    { key: "destaques", label: "Destaques", table: "destaques" },
  ];

  const funnel = await Promise.all(
    funnelLabels.map(async (f) => ({
      label: f.label,
      qtd: f.table
        ? await countDistinctUsers(f.table, periodCutoff)
        : await count("users", "created_at", periodCutoff),
    }))
  );

  // ─── DISTRIBUICAO DE PROFUNDIDADE (modulos completos por user) ──────
  // Calcula manual: pra cada user, conta quantos modulos tem
  const distribuicao = await calcDistribuicaoManual(supabase);

  // ─── CHAT STATS ──────────────────────────────────────────────────────
  const [totalSessoes, totalMsgs] = await Promise.all([
    count("chat_sessions"),
    count("chat_messages"),
  ]);
  const avgMsgsPorSessao =
    totalSessoes > 0 ? Math.round((totalMsgs / totalSessoes) * 10) / 10 : 0;

  // Top 5 sessoes mais ativas
  const { data: topSessoesRaw } = await supabase
    .from("chat_messages")
    .select("session_id");
  const sessaoCounts = new Map<string, number>();
  (topSessoesRaw || []).forEach((r: { session_id: string }) => {
    sessaoCounts.set(r.session_id, (sessaoCounts.get(r.session_id) || 0) + 1);
  });
  const topSessoes = Array.from(sessaoCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Pega info dos top
  let topSessoesDetalhadas: Array<{
    email: string;
    msgs: number;
  }> = [];
  if (topSessoes.length > 0) {
    const { data: sessoesInfo } = await supabase
      .from("chat_sessions")
      .select("id, channel_user_id, display_name")
      .in(
        "id",
        topSessoes.map((t) => t[0])
      );
    topSessoesDetalhadas = topSessoes.map(([id, msgs]) => {
      const info = sessoesInfo?.find((s) => s.id === id);
      return {
        email: info?.channel_user_id || "?",
        msgs,
      };
    });
  }

  // ─── TOKENS / CUSTO ──────────────────────────────────────────────────
  const [tokensHoje, tokens7d, tokens30d, custoHoje, custo7d, custo30d] =
    await Promise.all([
      sumTokens(supabase, cutoff24h),
      sumTokens(supabase, cutoff7d),
      sumTokens(supabase, cutoff30d),
      sumCost(supabase, cutoff24h),
      sumCost(supabase, cutoff7d),
      sumCost(supabase, cutoff30d),
    ]);

  // Top endpoints por custo (30d)
  const { data: aiCalls30dRaw } = await supabase
    .from("ai_calls")
    .select("endpoint, cost_usd")
    .gte("created_at", cutoff30d);
  const endpointCost = new Map<string, number>();
  (aiCalls30dRaw || []).forEach(
    (r: { endpoint: string | null; cost_usd: number | null }) => {
      const key = r.endpoint || "(sem endpoint)";
      endpointCost.set(key, (endpointCost.get(key) || 0) + (r.cost_usd || 0));
    }
  );
  const topEndpoints = Array.from(endpointCost.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, cost]) => ({ endpoint, cost_usd: cost }));

  // Top users por custo (30d)
  const { data: aiCallsByUser } = await supabase
    .from("ai_calls")
    .select("user_id, cost_usd")
    .gte("created_at", cutoff30d)
    .not("user_id", "is", null);
  const userCost = new Map<string, number>();
  (aiCallsByUser || []).forEach(
    (r: { user_id: string; cost_usd: number | null }) => {
      userCost.set(r.user_id, (userCost.get(r.user_id) || 0) + (r.cost_usd || 0));
    }
  );
  const topUserIds = Array.from(userCost.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let topUsers: Array<{ email: string; name: string | null; cost_usd: number }> = [];
  if (topUserIds.length > 0) {
    const { data: usersInfo } = await supabase
      .from("users")
      .select("id, email, name")
      .in(
        "id",
        topUserIds.map((t) => t[0])
      );
    topUsers = topUserIds.map(([id, cost]) => {
      const info = usersInfo?.find((u) => u.id === id);
      return {
        email: info?.email || "?",
        name: info?.name || null,
        cost_usd: cost,
      };
    });
  }

  // ─── CRESCIMENTO 30 DIAS ─────────────────────────────────────────────
  const { data: leadsTimeline } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", cutoff30d)
    .order("created_at");
  const growthByDay = bucketByDay(leadsTimeline || []);

  // ─── LISTA DE LEADS RECENTES ─────────────────────────────────────────
  const { data: recentLeads } = await supabase
    .from("users")
    .select(
      "id, email, name, instagram, phone, origem, blocked_at, access_status, is_admin, avatar_url, last_login_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Pra cada lead, conta modulos
  const leadsComModulos = await Promise.all(
    (recentLeads || []).map(async (u: {
      id: string;
      email: string;
      name: string;
      instagram: string | null;
      phone: string | null;
      origem: string | null;
      blocked_at: string | null;
      access_status: "pending" | "approved" | "blocked" | null;
      is_admin: boolean | null;
      avatar_url: string | null;
      last_login_at: string | null;
      created_at: string;
    }) => {
      const checks = await Promise.all(
        moduleTables.map(async (t) => {
          const { count: c } = await supabase
            .from(t)
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id);
          return Boolean(c && c > 0);
        })
      );
      const modulos_completos = checks.filter(Boolean).length;
      return { ...u, modulos_completos };
    })
  );

  return NextResponse.json({
    period,
    overview: {
      total_users: totalUsers,
      leads_hoje: leadsHoje,
      leads_7d: leads7d,
      leads_30d: leads30d,
      sessoes_chat_24h: sessoesChat24h,
      total_conteudos: totalConteudos,
      origem,
      users_by_status: usersByStatus,
    },
    utilizacoes: {
      janela_3h: {
        novos_leads: leads3h,
        chat_msgs: chatMsgs3h,
        ai_calls: aiCalls3h,
        modulos_completados: modulosNovos3h,
      },
      janela_24h: {
        novos_leads: leads24h,
        chat_msgs: chatMsgs24h,
        ai_calls: aiCalls24h,
        modulos_completados: modulosNovos24h,
      },
    },
    funnel,
    distribuicao,
    chat: {
      total_sessoes: totalSessoes,
      total_msgs: totalMsgs,
      avg_msgs_por_sessao: avgMsgsPorSessao,
      top_sessoes: topSessoesDetalhadas,
    },
    tokens: {
      hoje: tokensHoje,
      ult_7d: tokens7d,
      ult_30d: tokens30d,
      custo_usd: {
        hoje: custoHoje,
        ult_7d: custo7d,
        ult_30d: custo30d,
      },
      top_endpoints: topEndpoints,
      top_users: topUsers,
    },
    growth_30d: growthByDay,
    leads_recentes: leadsComModulos,
  });
}

function computeCutoff(period: "24h" | "7d" | "30d" | "all"): string | undefined {
  const now = Date.now();
  switch (period) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

async function sumTokens(
  supabase: SupabaseLike,
  since: string
): Promise<{ in: number; out: number }> {
  const { data } = await supabase
    .from("ai_calls")
    .select("tokens_in, tokens_out")
    .gte("created_at", since);
  if (!data) return { in: 0, out: 0 };
  return data.reduce(
    (acc: { in: number; out: number }, r: { tokens_in: number | null; tokens_out: number | null }) => ({
      in: acc.in + (r.tokens_in || 0),
      out: acc.out + (r.tokens_out || 0),
    }),
    { in: 0, out: 0 }
  );
}

async function sumCost(
  supabase: SupabaseLike,
  since: string
): Promise<number> {
  const { data } = await supabase
    .from("ai_calls")
    .select("cost_usd")
    .gte("created_at", since);
  if (!data) return 0;
  return data.reduce((acc: number, r: { cost_usd: number | null }) => acc + (r.cost_usd || 0), 0);
}

function bucketByDay(rows: Array<{ created_at: string }>): Array<{ date: string; count: number }> {
  const buckets = new Map<string, number>();
  // Inicializa 30 dias com zero
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(toISODate(d), 0);
  }
  rows.forEach((r) => {
    const d = toISODate(new Date(r.created_at));
    if (buckets.has(d)) buckets.set(d, (buckets.get(d) || 0) + 1);
  });
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function calcDistribuicaoManual(
  supabase: SupabaseLike
): Promise<Array<{ count: number; users: number }>> {
  const moduleTables = [
    "vozes",
    "icps",
    "posicionamentos",
    "territorios",
    "editorias",
    "ideias",
    "conteudos",
    "ofertas",
    "pitches",
    "bios",
    "destaques",
  ];

  const { data: users } = await supabase.from("users").select("id");
  if (!users) return [];

  // Pra cada user, conta modulos completos
  const counts = await Promise.all(
    users.map(async (u: { id: string }) => {
      const checks = await Promise.all(
        moduleTables.map(async (t) => {
          const { count: c } = await supabase
            .from(t)
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id);
          return Boolean(c && c > 0);
        })
      );
      return checks.filter(Boolean).length;
    })
  );

  // Histograma
  const histo = new Map<number, number>();
  for (let i = 0; i <= 11; i++) histo.set(i, 0);
  counts.forEach((c) => histo.set(c, (histo.get(c) || 0) + 1));

  return Array.from(histo.entries()).map(([count, users]) => ({ count, users }));
}
