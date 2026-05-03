"use client";

import { useState, useRef, useCallback } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "done" | "error";

export interface VoiceResult {
  raw: string;
  number: number | null;
  confidence: number;
}

// ──────────────────────────────────────────────────────
// Portuguese number word parser
// ──────────────────────────────────────────────────────
const PT_UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, três: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9,
};
const PT_TEENS: Record<string, number> = {
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14,
  quinze: 15, dezesseis: 16, dezasseis: 16, dezessete: 17, dezassete: 17,
  dezoito: 18, dezenove: 19, dezanove: 19,
};
const PT_TENS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60,
  setenta: 70, oitenta: 80, noventa: 90,
};
const PT_HUNDREDS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
  quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500,
  seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700,
  oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900,
};

function parsePortugueseWords(text: string): number | null {
  let s = text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\be\b/g, " ")
    .replace(/\bcom\b/g, " ")
    .replace(/\bmil\b/g, " 1000 ")
    .replace(/\s+/g, " ")
    .trim();

  s = s.replace(/\b(reais?|centavos?|litros?|litro|quilometros?|quilômetros?|km|real|virgula|ponto)\b/gi, " _ ");

  const tokens = s.split(/\s+/).filter(t => t && t !== "_");
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    if (token === "1000") {
      current = current === 0 ? 1000 : current * 1000;
      total += current;
      current = 0;
    } else if (PT_HUNDREDS[token] !== undefined) {
      current += PT_HUNDREDS[token];
    } else if (PT_TENS[token] !== undefined) {
      current += PT_TENS[token];
    } else if (PT_TEENS[token] !== undefined) {
      current += PT_TEENS[token];
    } else if (PT_UNITS[token] !== undefined) {
      current += PT_UNITS[token];
    }
  }
  total += current;

  return total === 0 ? null : total;
}

function extractNumber(raw: string): number | null {
  // 1. Try numeric literal first — handles "57,5" "57.5" "1.234,56"
  const numericMatch = raw.match(/[\d]+(?:[.,][\d]+)?(?:[.,][\d]+)?/);
  if (numericMatch) {
    let s = numericMatch[0];
    // Handle thousand separators: 1.234,56 → 1234.56
    if (/^\d{1,3}([.,]\d{3})+([.,]\d+)?$/.test(s)) {
      s = s.replace(/[.,](\d{3})(?=[.,]|$)/g, "$1").replace(",", ".");
    } else {
      s = s.replace(",", ".");
    }
    const n = parseFloat(s);
    if (!isNaN(n)) return n;
  }

  // 2. Try Portuguese word-based number
  return parsePortugueseWords(raw);
}

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition);
}

export interface UseVoiceInputOptions {
  onResult?: (result: VoiceResult) => void;
  onError?: (err: string) => void;
  field?: "integer" | "decimal";
}

export function useVoiceInput({ onResult, onError, field = "decimal" }: UseVoiceInputOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Track whether the current recognition session produced a result
  // (avoids stale-closure bugs when checking state inside rec.onend)
  const gotResultRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const fieldRef = useRef(field);

  // Keep refs in sync without re-creating `start` on every render
  onResultRef.current = onResult;
  onErrorRef.current = onError;
  fieldRef.current = field;

  const start = useCallback(() => {
    if (!isVoiceSupported()) {
      onErrorRef.current?.("Reconhecimento de voz não suportado neste navegador. Use Chrome ou Safari.");
      return;
    }

    // Stop any existing session cleanly
    recognitionRef.current?.abort();

    const SpeechRecognitionClass =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;

    const rec = new SpeechRecognitionClass();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;

    gotResultRef.current = false;
    recognitionRef.current = rec;
    setState("listening");
    setResult(null);

    rec.onresult = (event) => {
      gotResultRef.current = true;
      setState("processing");
      const alternatives = Array.from(event.results[0]);

      let bestNumber: number | null = null;
      let bestRaw = "";
      let bestConfidence = 0;

      for (const alt of alternatives) {
        const raw = alt.transcript.trim();
        const num = extractNumber(raw);
        if (num !== null && alt.confidence >= bestConfidence) {
          bestNumber = num;
          bestRaw = raw;
          bestConfidence = alt.confidence;
        }
        if (!bestRaw) {
          bestRaw = raw;
          bestConfidence = alt.confidence;
        }
      }

      if (fieldRef.current === "integer" && bestNumber !== null) {
        bestNumber = Math.round(bestNumber);
      }

      const r: VoiceResult = { raw: bestRaw, number: bestNumber, confidence: bestConfidence };
      setResult(r);
      setState("done");
      onResultRef.current?.(r);
    };

    rec.onerror = (event) => {
      gotResultRef.current = true; // prevents onend from overriding error state
      setState("error");
      const messages: Record<string, string> = {
        "no-speech": "Nenhuma fala detectada. Tente novamente.",
        "audio-capture": "Microfone não encontrado.",
        "not-allowed": "Permissão de microfone negada.",
        "network": "Erro de rede. Verifique sua conexão.",
        "aborted": "",
      };
      const msg = messages[event.error] ?? `Erro: ${event.error}`;
      if (msg) onErrorRef.current?.(msg);
      if (event.error === "aborted") setState("idle");
      recognitionRef.current = null;
    };

    rec.onend = () => {
      // If no result and no error was received, the recognition ended silently
      // (e.g. silence timeout) — reset to idle so the user can try again
      if (!gotResultRef.current) {
        setState("idle");
      }
      recognitionRef.current = null;
    };

    rec.start();
  }, []); // stable — uses refs for all dependencies

  const stop = useCallback(() => {
    gotResultRef.current = true; // prevent onend from resetting state
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    gotResultRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setResult(null);
    setState("idle");
  }, []);

  return { state, result, start, stop, reset, supported: isVoiceSupported() };
}
