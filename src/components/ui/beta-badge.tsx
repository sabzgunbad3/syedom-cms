import { cn } from "@/lib/utils";

interface BetaBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function BetaBadge({ className, size = "sm" }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full bg-primary/10 text-primary border border-primary/20",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      Beta
    </span>
  );
}
