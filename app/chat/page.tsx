"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

type Session = {
  id: string;
  channel: string;
  channel_user_id: string;
  display_name?: string | null;
};

const STORAGE_KEY = "iabdo-chat-session";

type StoredSession = {
  email: string;
  displayName?: string;
  sessionId: string;
};

export default function ChatPage() {
  const [stored, setStored] = useState<StoredSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Tela de entrada
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [entering, setEntering] = useState(false);

  // Conversa
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Hidrata sessao do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Auto-load se ja tem sessao salva
  useEffect(() => {
    if (!hydrated || !stored) return;
    (async () => {
      try {
        const resp = await fetch("/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: stored.email,
            displayName: stored.displayName,
          }),
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        setSession(data.session);
        setMessages(data.messages || []);
      } catch {
        toast.error("Nao foi possivel recuperar a sessao. Entre de novo.");
        localStorage.removeItem(STORAGE_KEY);
        setStored(null);
      }
    })();
  }, [hydrated, stored]);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Email invalido.");
      return;
    }
    setEntering(true);
    try {
      const resp = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          displayName: name.trim() || undefined,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSession(data.session);
      setMessages(data.messages || []);

      const toStore: StoredSession = {
        email: email.trim().toLowerCase(),
        displayName: name.trim() || undefined,
        sessionId: data.session.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      setStored(toStore);
    } catch {
      toast.error("Erro ao entrar. Tenta de novo.");
    } finally {
      setEntering(false);
    }
  };

  const handleSend = async () => {
    if (!session || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");

    // Otimista: ja mostra a mensagem do usuario
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, created_at: new Date().toISOString() },
    ]);
    setSending(true);

    try {
      const resp = await fetch("/api/chat/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, message: text }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "erro");
      }
      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar mensagem"
      );
      // Retira a mensagem otimista que nao foi respondida
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
    setSession(null);
    setMessages([]);
    setEmail("");
    setName("");
  };

  // ─────────────────────────────────────────────────────────
  // Render: tela de entrada
  // ─────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-2">💬</div>
            <h1 className="text-3xl font-bold">iAbdo Chat</h1>
            <p className="text-muted-foreground mt-2">
              Conversa direta com seu estrategista de marca pessoal.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleEnter} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={entering}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado pra recuperar suas conversas em qualquer dispositivo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome (opcional)</Label>
                  <Input
                    id="name"
                    placeholder="Como prefere ser chamado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={entering}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={entering}
                >
                  {entering ? "Entrando..." : "Entrar →"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render: tela de conversa
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-xl">💬</div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm">iAbdo Chat</h1>
            <p className="text-xs text-muted-foreground truncate">
              {session.display_name || session.channel_user_id}
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto text-center text-muted-foreground text-sm">
            <p className="mb-2">
              Bem-vindo! Manda uma mensagem pra começar.
            </p>
            <p className="text-xs">
              Ex: <span className="font-mono">/ajuda</span>{" "}
              ou <span className="font-mono">quero gerar minha voz da marca</span>
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={m.id || i} message={m} />
        ))}

        {sending && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 inline-block text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-background px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !sending) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Mensagem... (Enter envia, Shift+Enter quebra linha)"
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            disabled={sending}
          />
          <Button
            size="lg"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMsg }) {
  const isUser = message.role === "user";

  return (
    <div className={"max-w-3xl mx-auto " + (isUser ? "flex justify-end" : "")}>
      <div
        className={
          "rounded-lg px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed " +
          (isUser
            ? "bg-primary text-primary-foreground max-w-[85%]"
            : "bg-muted text-foreground")
        }
      >
        {message.content}
      </div>
    </div>
  );
}
