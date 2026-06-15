export function formatDate(iso?: string): string {
  if (!iso) return "—";
  // Parse YYYY-MM-DD as a local date — otherwise new Date(iso) treats it as
  // UTC midnight and the day shifts west in negative-UTC timezones.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m
    ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
    : new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.max(0, daysBetween(iso, new Date().toISOString()));
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function age(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
