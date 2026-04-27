"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useUserStore } from "@/hooks/use-user-store";

type Period = "24h" | "7d" | "30d" | "all";

type Stats = {
  period: Period;
  overview: {
    total_users: number;
    leads_hoje: number;
    leads_7d: number;
    leads_30d: number;
    sessoes_chat_24h: number;
    total_conteudos: number;
    origem: { chat: number; platform: number; sem_origem: number };
  };
  utilizacoes: {
    janela_3h: { novos_leads: number; chat_msgs: number; ai_calls: number; modulos_completados: number };
    janela_24h: { novos_leads: number; chat_msgs: number; ai_calls: number; modulos_completados: number };
  };
  funnel: Array<{ label: string; qtd: number }>;
  distribuicao: Array<{ count: number; users: number }>;
  chat: {
    total_sessoes: number;
    total_msgs: number;
    avg_msgs_por_sessao: number;
    top_sessoes: Array<{ email: string; msgs: number }>;
  };
  tokens: {
    hoje: { in: number; out: number };
    ult_7d: { in: number; out: number };
    ult_30d: { in: number; out: number };
    custo_usd: { hoje: number; ult_7d: number; ult_30d: number };
    top_endpoints: Array<{ endpoint: string; cost_usd: number }>;
    top_users: Array<{ email: string; name: string | null; cost_usd: number }>;
  };
  growth_30d: Array<{ date: string; count: number }>;
  leads_recentes: Array<{
    id: string;
    email: string;
    name: string;
    instagram: string | null;
    origem: string | null;
    created_at: string;
    modulos_completos: number;
  }>;
};

export default function AdminPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);

  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth: precisa estar logado E ser admin
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/");
      return;
    }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user, period]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/stats?period=${period}`, {
        headers: { "x-admin-email": user.email },
      });
      if (resp.status === 401) {
        setError("Você não tem acesso a esse painel.");
        toast.error("Acesso negado.");
        return;
      }
      if (!resp.ok) throw new Error();
      const data = (await resp.json()) as Stats;
      setStats(data);
    } catch {
      setError("Falha ao carregar estatísticas.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || (loading && !stats)) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted-foreground">
        Carregando dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold mb-2">⚠️ {error}</p>
            <Button onClick={() => router.push("/dashboard")}>Voltar ao app</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-dvh bg-muted/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">📊 Painel Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Logado como {user?.email}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <PeriodFilter period={period} onChange={setPeriod} />
            <Button size="sm" variant="outline" onClick={fetchStats} disabled={loading}>
              {loading ? "..." : "↻"}
            </Button>
          </div>
        </div>

        {/* Overview */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Visão geral
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total leads" value={stats.overview.total_users} />
            <StatCard label="Hoje (24h)" value={stats.overview.leads_hoje} />
            <StatCard label="7 dias" value={stats.overview.leads_7d} />
            <StatCard label="30 dias" value={stats.overview.leads_30d} />
            <StatCard label="Sessões chat (24h)" value={stats.overview.sessoes_chat_24h} />
            <StatCard label="Conteúdos gerados" value={stats.overview.total_conteudos} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <StatCard label="Origem: Plataforma" value={stats.overview.origem.platform} muted />
            <StatCard label="Origem: Chat" value={stats.overview.origem.chat} muted />
            <StatCard label="Sem origem (antigos)" value={stats.overview.origem.sem_origem} muted />
          </div>
        </section>

        {/* Utilizações */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Atividade recente
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <ActivityWindow label="🕒 Últimas 3 horas" data={stats.utilizacoes.janela_3h} />
            <ActivityWindow label="🕓 Últimas 24 horas" data={stats.utilizacoes.janela_24h} />
          </div>
        </section>

        {/* Tokens */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Consumo de IA (Anthropic)
          </h2>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <TokenCard
              label="Hoje (24h)"
              tokens={stats.tokens.hoje}
              cost={stats.tokens.custo_usd.hoje}
            />
            <TokenCard
              label="Últimos 7 dias"
              tokens={stats.tokens.ult_7d}
              cost={stats.tokens.custo_usd.ult_7d}
            />
            <TokenCard
              label="Últimos 30 dias"
              tokens={stats.tokens.ult_30d}
              cost={stats.tokens.custo_usd.ult_30d}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Top endpoints por custo (30d)</h3>
                <SimpleTable
                  cols={["Endpoint", "Custo"]}
                  rows={stats.tokens.top_endpoints.map((t) => [
                    t.endpoint,
                    `$${t.cost_usd.toFixed(4)}`,
                  ])}
                  emptyMsg="Nenhuma chamada registrada ainda."
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Top users por custo (30d)</h3>
                <SimpleTable
                  cols={["Usuário", "Custo"]}
                  rows={stats.tokens.top_users.map((t) => [
                    t.name ? `${t.name} (${t.email})` : t.email,
                    `$${t.cost_usd.toFixed(4)}`,
                  ])}
                  emptyMsg="—"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Funil */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Funil de ativação ({period === "all" ? "tudo" : period})
          </h2>
          <Card>
            <CardContent className="p-4">
              <FunnelChart funnel={stats.funnel} />
            </CardContent>
          </Card>
        </section>

        {/* Crescimento */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Crescimento últimos 30 dias
          </h2>
          <Card>
            <CardContent className="p-4">
              <GrowthBars data={stats.growth_30d} />
            </CardContent>
          </Card>
        </section>

        {/* Distribuição */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Profundidade de uso (módulos completos por aluno)
          </h2>
          <Card>
            <CardContent className="p-4">
              <Distribuicao data={stats.distribuicao} />
            </CardContent>
          </Card>
        </section>

        {/* Chat */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            iAbdo Chat
          </h2>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <StatCard label="Sessões totais" value={stats.chat.total_sessoes} />
            <StatCard label="Mensagens totais" value={stats.chat.total_msgs} />
            <StatCard
              label="Média msgs / sessão"
              value={stats.chat.avg_msgs_por_sessao}
              decimal
            />
          </div>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Top sessões mais ativas</h3>
              <SimpleTable
                cols={["Email", "Mensagens"]}
                rows={stats.chat.top_sessoes.map((t) => [t.email, String(t.msgs)])}
                emptyMsg="Sem dados de chat ainda."
              />
            </CardContent>
          </Card>
        </section>

        {/* Lista de leads */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Últimos 50 leads
          </h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs uppercase">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">@</th>
                    <th className="px-3 py-2">Origem</th>
                    <th className="px-3 py-2 text-center">Módulos</th>
                    <th className="px-3 py-2">Entrou</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leads_recentes.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 truncate max-w-[200px]">{u.email}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{u.name || "—"}</td>
                      <td className="px-3 py-2 truncate max-w-[120px] text-muted-foreground">
                        {u.instagram ? `@${u.instagram}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <OrigemBadge origem={u.origem} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <ModulosBadge n={u.modulos_completos} />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <div className="text-center text-xs text-muted-foreground py-4">
          Dashboard atualiza ao trocar período ou clicar ↻
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────

function PeriodFilter({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const opts: Array<{ k: Period; label: string }> = [
    { k: "24h", label: "24h" },
    { k: "7d", label: "7d" },
    { k: "30d", label: "30d" },
    { k: "all", label: "Tudo" },
  ];
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      {opts.map((o) => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          className={
            "px-3 py-1 text-xs font-medium rounded transition-colors " +
            (period === o.k
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  muted,
  decimal,
}: {
  label: string;
  value: number;
  muted?: boolean;
  decimal?: boolean;
}) {
  return (
    <Card className={muted ? "bg-muted/40" : ""}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold mt-1">
          {decimal ? value.toFixed(1) : value.toLocaleString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityWindow({
  label,
  data,
}: {
  label: string;
  data: { novos_leads: number; chat_msgs: number; ai_calls: number; modulos_completados: number };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">{label}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Mini label="Novos leads" v={data.novos_leads} />
          <Mini label="Mensagens chat" v={data.chat_msgs} />
          <Mini label="Chamadas IA" v={data.ai_calls} />
          <Mini label="Módulos completados" v={data.modulos_completados} />
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{v.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function TokenCard({
  label,
  tokens,
  cost,
}: {
  label: string;
  tokens: { in: number; out: number };
  cost: number;
}) {
  const total = tokens.in + tokens.out;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">${cost.toFixed(4)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {total.toLocaleString("pt-BR")} tokens
          <span className="ml-1 text-muted-foreground/60">
            ({tokens.in.toLocaleString("pt-BR")} in / {tokens.out.toLocaleString("pt-BR")} out)
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelChart({ funnel }: { funnel: Array<{ label: string; qtd: number }> }) {
  const max = Math.max(...funnel.map((f) => f.qtd), 1);
  const baseline = funnel[0]?.qtd || 1;

  return (
    <div className="space-y-2">
      {funnel.map((f, i) => {
        const pctOfMax = (f.qtd / max) * 100;
        const pctOfBaseline = baseline > 0 ? Math.round((f.qtd / baseline) * 100) : 0;
        const isBig = pctOfBaseline >= 70;
        const isSmall = pctOfBaseline < 30;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 text-sm text-right truncate flex-shrink-0">
              {f.label}
            </div>
            <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
              <div
                className={
                  "h-full rounded transition-all " +
                  (isSmall
                    ? "bg-amber-500/70"
                    : isBig
                    ? "bg-primary/80"
                    : "bg-primary/60")
                }
                style={{ width: `${pctOfMax}%` }}
              />
              <div className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                {f.qtd.toLocaleString("pt-BR")}{" "}
                <span className="text-muted-foreground ml-1">({pctOfBaseline}%)</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrowthBars({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        const day = d.date.slice(8, 10);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full bg-primary/70 hover:bg-primary rounded-t transition-colors min-h-[2px] relative"
              style={{ height: `${h}%` }}
              title={`${d.date}: ${d.count} leads`}
            >
              {d.count > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-1 rounded">
                  {d.count}
                </span>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function Distribuicao({ data }: { data: Array<{ count: number; users: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  }
  const max = Math.max(...data.map((d) => d.users), 1);
  const totalUsers = data.reduce((a, b) => a + b.users, 0);
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = totalUsers > 0 ? Math.round((d.users / totalUsers) * 100) : 0;
        return (
          <div key={d.count} className="flex items-center gap-2 text-sm">
            <div className="w-24 text-right text-xs text-muted-foreground">
              {d.count} {d.count === 1 ? "módulo" : "módulos"}
            </div>
            <div className="flex-1 h-5 bg-muted/50 rounded relative overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded"
                style={{ width: `${(d.users / max) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center px-2 text-xs">
                {d.users} ({pct}%)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleTable({
  cols,
  rows,
  emptyMsg,
}: {
  cols: string[];
  rows: string[][];
  emptyMsg: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMsg}</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-muted-foreground">
          {cols.map((c) => (
            <th key={c} className="py-1">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t">
            {r.map((cell, j) => (
              <td key={j} className="py-1.5 truncate max-w-[280px]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrigemBadge({ origem }: { origem: string | null }) {
  if (origem === "chat")
    return (
      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
        chat
      </span>
    );
  if (origem === "platform")
    return (
      <span className="text-xs bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 px-2 py-0.5 rounded">
        plataforma
      </span>
    );
  return <span className="text-xs text-muted-foreground">—</span>;
}

function ModulosBadge({ n }: { n: number }) {
  const totalModulos = 11; // total de tabelas de modulo
  const isHigh = n >= 7;
  const isMid = n >= 3;
  return (
    <span
      className={
        "text-xs font-mono px-2 py-0.5 rounded " +
        (isHigh
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : isMid
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          : "bg-muted text-muted-foreground")
      }
    >
      {n}/{totalModulos}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

