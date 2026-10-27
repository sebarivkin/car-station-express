"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText = "Guardando…",
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
