"use client";

import { useToastStore, type ToastKind } from "@/lib/toast";

const styles: Record<ToastKind, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", icon: "✓" },
  error: { bg: "bg-red-50", border: "border-red-300", text: "text-red-900", icon: "⚠" },
  warning: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", icon: "!" },
  info: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-900", icon: "i" },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const s = styles[t.kind];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border ${s.bg} ${s.border} ${s.text} p-3 shadow-lg flex items-start gap-3 animate-[slideIn_0.2s_ease-out]`}
            role="alert"
          >
            <div className={`h-6 w-6 rounded-full ${s.border} border flex items-center justify-center font-bold flex-shrink-0`}>
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.body && <div className="text-xs mt-0.5 opacity-80">{t.body}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-stone-500 hover:text-stone-800 flex-shrink-0 leading-none"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
