import { CircleAlert, CircleCheck } from "lucide-react";

export default function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  const esError = Boolean(error);
  return (
    <div
      role={esError ? "alert" : "status"}
      className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-left text-sm font-bold ${
        esError ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok"
      }`}
    >
      {esError ? <CircleAlert size={18} className="mt-px shrink-0" /> : <CircleCheck size={18} className="mt-px shrink-0" />}
      <span>{error ?? ok}</span>
    </div>
  );
}
