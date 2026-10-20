import { AlertTriangle, RotateCcw } from "lucide-react";

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 18, width: `${90 - i * 12}%` }} />
      ))}
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>Loading…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle size={22} color="var(--error)" />
      <div style={{ marginTop: 8, fontWeight: 700 }}>{message}</div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RotateCcw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
