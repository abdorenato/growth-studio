"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Tipos minimos pro Web Speech API (nao vem por padrao em lib.dom).
// Detalhes completos: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorLike = { error: string; message?: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type UseSpeechRecognitionReturn = {
  isSupported: boolean;
  isListening: boolean;
  /** texto reconhecido desde o ultimo start() — atualiza em tempo real */
  transcript: string;
  /** erro humano-legivel se a ultima sessao falhou */
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

/**
 * Hook pra reconhecimento de voz via Web Speech API (browser-native).
 * Funciona em iOS Safari 14.5+, Chrome Android, Chrome/Edge desktop.
 * Nao funciona em Firefox.
 *
 * Uso:
 *   const { isSupported, isListening, transcript, start, stop } = useSpeechRecognition("pt-BR");
 *   useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);
 */
export function useSpeechRecognition(lang = "pt-BR"): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef<string>("");

  // Feature detection so client-side
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const cleanup = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Reconhecimento de voz não disponível neste navegador.");
      return;
    }

    cleanup();
    finalTextRef.current = "";
    setTranscript("");
    setError(null);

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const txt = result[0].transcript;
        if (result.isFinal) {
          finalTextRef.current += txt;
        } else {
          interim += txt;
        }
      }
      setTranscript((finalTextRef.current + interim).trim());
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (e) => {
      const msg = humanizeError(e.error);
      console.warn("SpeechRecognition error:", e.error, e.message);
      setError(msg);
      setIsListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err) {
      console.error("Falha ao iniciar reconhecimento:", err);
      setError("Não foi possível iniciar a captura. Tente de novo.");
      setIsListening(false);
    }
  }, [lang, cleanup]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    finalTextRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  // Cleanup ao desmontar
  useEffect(() => cleanup, [cleanup]);

  return { isSupported, isListening, transcript, error, start, stop, reset };
}

function humanizeError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "permission-denied":
      return "Permissão de microfone negada. Habilite nas configurações do navegador.";
    case "no-speech":
      return "Não captei nada. Fala mais perto do microfone.";
    case "audio-capture":
      return "Microfone não encontrado.";
    case "network":
      return "Erro de rede no reconhecimento.";
    case "aborted":
      return ""; // usuário parou — nao mostra erro
    default:
      return `Erro: ${code}`;
  }
}
