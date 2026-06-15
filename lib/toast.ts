"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  ttlMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "ttlMs"> & { ttlMs?: number }) => void;
  dismiss: (id: string) => void;
}

const uid = () => `t-${Math.floor(Math.random() * 1_000_000).toString(36)}`;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = uid();
    const ttlMs = t.ttlMs ?? (t.kind === "error" ? 8000 : 4000);
    set((s) => ({ toasts: [...s.toasts, { ...t, id, ttlMs }] }));
    setTimeout(() => get().dismiss(id), ttlMs);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, body?: string) =>
    useToastStore.getState().push({ kind: "success", title, body }),
  error: (title: string, body?: string) =>
    useToastStore.getState().push({ kind: "error", title, body }),
  warning: (title: string, body?: string) =>
    useToastStore.getState().push({ kind: "warning", title, body }),
  info: (title: string, body?: string) =>
    useToastStore.getState().push({ kind: "info", title, body }),
};
