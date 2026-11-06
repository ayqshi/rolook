"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4 flex flex-col gap-1 hover:shadow-md transition-shadow",
        accent && "border-brand/40 bg-brand-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", accent ? "text-brand" : "text-muted-foreground")} />
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-muted animate-pulse rounded" />
      ) : (
        <span className="text-2xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      )}
    </Card>
  );
}
