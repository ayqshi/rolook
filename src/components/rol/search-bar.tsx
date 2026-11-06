"use client";

import * as React from "react";
import { Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  onSearch,
  loading,
  size = "lg",
  autoFocus,
  initialValue = "",
  recent,
  onClearRecent,
}: {
  onSearch: (q: string) => void;
  loading?: boolean;
  size?: "lg" | "sm";
  autoFocus?: boolean;
  initialValue?: string;
  recent?: string[];
  onClearRecent?: () => void;
}) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSearch(trimmed);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className={cn(
          "flex items-center gap-2 w-full",
          size === "lg" ? "flex-col sm:flex-row" : "flex-row",
        )}
      >
        <div className="relative w-full">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
              size === "lg" ? "h-5 w-5" : "h-4 w-4",
            )}
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a Roblox username…"
            autoFocus={autoFocus}
            disabled={loading}
            className={cn(
              "w-full pr-9",
              size === "lg" ? "h-12 pl-10 text-base" : "h-9 pl-9",
            )}
            aria-label="Roblox username"
          />
          {value && !loading && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !value.trim()}
          className={cn(
            "shrink-0 bg-brand text-brand-foreground hover:bg-brand/90",
            size === "lg" ? "h-12 px-6" : "h-9 px-4",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {recent && recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Recent:</span>
          {recent.map((r) => (
            <button
              key={r}
              onClick={() => {
                setValue(r);
                onSearch(r);
              }}
              className="text-xs px-2.5 py-1 rounded-full border bg-card hover:bg-accent transition-colors"
            >
              {r}
            </button>
          ))}
          {onClearRecent && (
            <button
              onClick={onClearRecent}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
              aria-label="Clear recent searches"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
