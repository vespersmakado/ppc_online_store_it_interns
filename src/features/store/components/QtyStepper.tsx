import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  size?: "md" | "sm";
  label: string;
};

export function QtyStepper({ value, onChange, min = 0, step = 1, size = "md", label }: Props) {
  const btn = size === "md" ? "size-11 rounded-lg" : "size-8 rounded-md";
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-border bg-background p-1",
        size === "sm" && "rounded-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className={cn(
          btn,
          "flex items-center justify-center text-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-40",
        )}
      >
        <Minus className="size-4" />
      </button>
      <output
        aria-label={label}
        className={cn(
          "w-full min-w-0 text-center font-bold tabular-nums",
          size === "md" ? "text-lg" : "w-10 text-sm",
        )}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.max(min, value) + step)}
        className={cn(
          btn,
          "flex items-center justify-center bg-ink text-ink-foreground transition-colors hover:bg-primary",
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
