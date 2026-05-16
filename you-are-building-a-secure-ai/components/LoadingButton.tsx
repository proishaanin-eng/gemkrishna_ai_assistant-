"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

export function LoadingButton({ loading, children, className, variant = "primary", disabled, ...props }: LoadingButtonProps) {
  const styles = {
    primary: "bg-gold text-ink hover:bg-[#c99e4f]",
    secondary: "border border-stone-200 bg-white text-ink hover:border-gold",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
