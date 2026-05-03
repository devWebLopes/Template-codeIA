"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-br">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            textAlign: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Algo deu errado
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", maxWidth: "24rem" }}>
            Ocorreu um erro crítico. Tente recarregar a página.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
