import Link from "next/link";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon = "•",
  title,
  body,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="card p-8 md:p-12 text-center">
      <div className="text-4xl mb-3 text-stone-500">{icon}</div>
      <h3 className="text-lg font-bold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-600 max-w-md mx-auto mb-4">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
