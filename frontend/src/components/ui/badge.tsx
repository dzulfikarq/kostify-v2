import { cn } from "@/utils/cn";

export function Badge({ children, tone = "zinc", className }: { children: React.ReactNode; tone?: "zinc" | "green" | "amber" | "red" | "blue"; className?: string }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
