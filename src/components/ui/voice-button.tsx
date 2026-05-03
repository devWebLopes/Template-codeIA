"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { type VoiceState } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
  supported: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function VoiceButton({ state, onStart, onStop, supported, className, size = "md" }: VoiceButtonProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!supported) return null;

  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isActive = isListening || isProcessing;

  const sizeClasses = size === "sm"
    ? "h-7 w-7"
    : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={isProcessing}
      title={isListening ? "Parar gravação" : "Falar valor"}
      className={cn(
        "relative flex items-center justify-center rounded-lg border transition-all shrink-0",
        sizeClasses,
        isListening
          ? "border-red-500 bg-red-500 text-white animate-pulse shadow-[0_0_0_4px_rgba(239,68,68,0.2)]"
          : isProcessing
          ? "border-orange-400 bg-orange-50 text-orange-500 dark:bg-orange-950"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5",
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className={cn("animate-spin", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : isListening ? (
        <MicOff className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : (
        <Mic className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      )}
    </button>
  );
}

interface VoiceFieldProps {
  label: string;
  state: VoiceState;
  rawText?: string;
  parsedNumber?: number | null;
  onConfirm?: (value: number) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  unit?: string;
}

export function VoiceResultCard({
  label,
  state,
  rawText,
  parsedNumber,
  onConfirm,
  onRetry,
  onDismiss,
  unit = "",
}: VoiceFieldProps) {
  if (state === "idle") return null;

  if (state === "listening") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        Ouvindo... fale o valor de {label.toLowerCase()}
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-400/5 px-3 py-2 text-xs text-orange-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processando fala...
      </div>
    );
  }

  if (state === "done" && rawText !== undefined) {
    const hasNumber = parsedNumber !== null && parsedNumber !== undefined;
    return (
      <div className={`rounded-lg border px-3 py-2 text-xs space-y-2 ${hasNumber ? "border-green-500/30 bg-green-500/5" : "border-orange-400/30 bg-orange-400/5"}`}>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Você disse:</p>
          <p className="font-medium text-foreground italic">"{rawText}"</p>
        </div>
        {hasNumber ? (
          <>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Valor reconhecido:</p>
              <p className="font-bold text-green-700 dark:text-green-400 text-base">
                {Number.isInteger(parsedNumber) ? parsedNumber!.toLocaleString("pt-BR") : parsedNumber!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                {unit && <span className="text-xs font-normal ml-1 text-muted-foreground">{unit}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onConfirm?.(parsedNumber!)}
                className="flex-1 rounded-md bg-green-600 text-white py-1.5 text-xs font-medium hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-orange-700 dark:text-orange-400">Não foi possível identificar um número. Fale apenas o valor (ex: "cinquenta e sete").</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 rounded-md bg-orange-500 text-white py-1.5 text-xs font-medium hover:bg-orange-600 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (state === "error") {
    return null;
  }

  return null;
}
