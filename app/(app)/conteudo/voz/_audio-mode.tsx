"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, Upload, Sparkles, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { DISCOVERY_QUESTIONS } from "@/lib/voz/constants";

type AudioModeProps = {
  userId: string;
  onComplete: (result: AnalysisResult) => void;
  onBack: () => void;
};

export type AnalysisResult = {
  extracao_bruta: {
    palavras_frequentes: string[];
    frases_chave_literais: string[];
    marcadores_emocionais: string;
    ritmo_e_pessoa: string;
    estrutura_discursiva: string;
  };
  arquetipo_primario: string;
  arquetipo_secundario: string;
  justificativa: string;
  mapa_voz: {
    energia_arquetipica: string;
    tom_de_voz: string;
    frase_essencia: string;
    frase_impacto: string;
    palavras_usar: string[];
    palavras_evitar: string[];
  };
  insights_especificos: string[];
  lacunas: string;
  transcricao?: string;
};

type Phase =
  | "instrucoes"
  | "gravando"
  | "preview"
  | "enviando"
  | "transcrevendo"
  | "analisando";

const MAX_DURATION_S = 480; // 8 min

export function AudioMode({ userId, onComplete, onBack }: AudioModeProps) {
  const [phase, setPhase] = useState<Phase>("instrucoes");
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  // ─── GRAVAR ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: pickMimeType(),
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setPhase("preview");
        // Stop tracks pra liberar microfone
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase("gravando");
      setSeconds(0);

      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_DURATION_S) {
            stopRecording();
            return s + 1;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(
        "Não consegui acessar o microfone. Verifique permissão do navegador."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ─── UPLOAD ──────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Arquivo maior que 25MB.");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      toast.error("Arquivo não é áudio.");
      return;
    }
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setPhase("preview");
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);
    setPhase("instrucoes");
  };

  // ─── PROCESSAR ───────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!audioBlob) return;
    if (!consent) {
      toast.error("Marque o consentimento de uso do áudio.");
      return;
    }

    try {
      // 1. Upload
      setPhase("enviando");
      setProgress("Enviando áudio...");

      const fd = new FormData();
      fd.append("audio", audioBlob, `voz-${Date.now()}.webm`);
      fd.append("userId", userId);

      const upResp = await fetch("/api/voz/audio/upload", {
        method: "POST",
        body: fd,
      });
      const upData = await upResp.json();

      if (!upResp.ok) {
        throw new Error(upData.error || "Falha no upload");
      }

      const jobId = upData.jobId as string;

      // 2. Process (transcribe + analyze) — pode demorar 25-50s
      setPhase("transcrevendo");
      setProgress("Transcrevendo áudio...");

      const procResp = await fetch(`/api/voz/audio/process/${jobId}`, {
        method: "POST",
      });
      const procData = await procResp.json();

      if (!procResp.ok) {
        throw new Error(procData.error || "Falha ao processar");
      }

      onComplete({
        ...procData.resultado,
        transcricao: procData.transcricao,
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao processar");
      setPhase("preview");
      setProgress("");
    }
  };

  // ─── RENDERS POR FASE ────────────────────────────────────────────

  const isProcessing =
    phase === "enviando" || phase === "transcrevendo" || phase === "analisando";

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-5xl">🎙️</div>
            <h2 className="text-xl font-semibold">{progress || "Processando..."}</h2>
            <p className="text-sm text-muted-foreground">
              Isso pode levar até 1 minuto. Não feche essa aba.
            </p>
            <div className="flex justify-center gap-1 pt-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div>
        <h1 className="text-3xl font-bold">🎙️ Voz da Marca por áudio</h1>
        <p className="text-muted-foreground mt-1">
          Fale por uns 5 minutos respondendo essas 6 perguntas como se estivesse
          conversando comigo. <strong>Não precisa estar polido</strong> — quanto mais
          natural, melhor a IA captura sua voz real.
        </p>
      </div>

      {/* Roteiro das perguntas (sempre visível, lê enquanto fala) */}
      <Card className="bg-muted/30">
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            📝 Roteiro (leia enquanto fala)
          </p>
          <ol className="space-y-2 text-sm">
            {DISCOVERY_QUESTIONS.map((q, i) => (
              <li key={q.key} className="flex gap-2">
                <span className="text-primary font-semibold flex-shrink-0">
                  {i + 1}.
                </span>
                <span>{q.question}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Separator />

      {/* Estado: gravando OU preview OU instruções */}
      {phase === "gravando" && (
        <Card className="border-red-500/40">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <Mic className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-mono font-bold tabular-nums">
              {formatTime(seconds)}
            </p>
            <p className="text-sm text-muted-foreground">
              Gravando... {seconds < 180 ? "vá com calma" : seconds < 360 ? "ótimo, continua" : "pode finalizar quando quiser"}
            </p>
            <Button onClick={stopRecording} size="lg" variant="destructive">
              <Square className="mr-2 h-4 w-4" /> Parar gravação
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "preview" && audioUrl && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm font-medium">Pronto pra processar?</p>
            <audio controls src={audioUrl} className="w-full" />

            <div className="flex items-start gap-2 pt-2">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <Label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                Concordo que o áudio seja transcrito pra extrair minha voz da marca.
                Após processar, o áudio é <strong>deletado automaticamente</strong>.
                A transcrição (texto) fica salva pra eu reanalisar depois se quiser.
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={reset} variant="outline" className="flex-1">
                Refazer
              </Button>
              <Button onClick={handleProcess} disabled={!consent} className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" /> Analisar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "instrucoes" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Card
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={startRecording}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-7 h-7 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">Gravar agora</h3>
              <p className="text-xs text-muted-foreground">
                Direto do navegador. Até 8 minutos.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
              </div>
              <h3 className="font-semibold">Subir arquivo</h3>
              <p className="text-xs text-muted-foreground">
                MP3, M4A, WAV, OGG ou WebM. Até 25MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Áudio limpo a cada análise. Só a transcrição persiste pra você poder
        regerar sem refazer a gravação.
      </p>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function pickMimeType(): string {
  // Prefere webm/opus que é o mais compatível com Whisper + browsers modernos
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) {
      return c;
    }
  }
  return "audio/webm";
}
