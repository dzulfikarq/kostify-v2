import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ label, error, className, ...props }, ref) => (
  <label className="block space-y-1.5">
    {label && <span className="text-sm font-medium text-zinc-700">{label}</span>}
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 transition",
        error ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-zinc-200 focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]",
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </label>
));
Input.displayName = "Input";
