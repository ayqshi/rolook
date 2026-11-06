"use client";

import * as React from "react";
import {
  Calendar,
  Eye,
  Gamepad2,
  Heart,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge as UiBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Game = {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string | null;
  creator: { id: number; name: string; type: "User" | "Group"; hasVerifiedBadge: boolean };
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  favoritedCount: number;
  genre: string | null;
  iconUrl: string | null;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function GameCard({ game }: { game: Game }) {
  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      <a
        href={`https://www.roblox.com/games/${game.rootPlaceId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video bg-muted relative overflow-hidden"
      >
        {game.iconUrl ? (
           
          <img
            src={game.iconUrl}
            alt={game.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Gamepad2 className="h-8 w-8" />
          </div>
        )}
        {game.playing > 0 && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            {formatNumber(game.playing)} playing
          </span>
        )}
      </a>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <a
          href={`https://www.roblox.com/games/${game.rootPlaceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm leading-tight line-clamp-2 hover:underline"
          title={game.name}
        >
          {game.name}
        </a>
        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
          <span className="truncate">by {game.creator.name}</span>
          {game.creator.hasVerifiedBadge && (
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-sky-500 shrink-0" fill="currentColor">
              <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </div>
        {game.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-0.5">
            {game.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5" title="Total visits">
            <Eye className="h-3 w-3" />
            {formatNumber(game.visits)}
          </span>
          <span className="inline-flex items-center gap-0.5" title="Favorites">
            <Heart className="h-3 w-3" />
            {formatNumber(game.favoritedCount)}
          </span>
          <span className="inline-flex items-center gap-0.5" title="Max players">
            <Users className="h-3 w-3" />
            {formatNumber(game.maxPlayers)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function GameGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function GamesDiscovery({
  onOpenGame,
}: {
  onOpenGame?: (game: Game) => void;
}) {
  const [mode, setMode] = React.useState<"popular" | "search">("popular");
  const [query, setQuery] = React.useState("");
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPopular = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/games/popular?limit=48");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setGames(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearch = React.useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/games/search?q=${encodeURIComponent(q)}&limit=48`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setGames(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load popular on first mount
  React.useEffect(() => {
    if (mode === "popular") fetchPopular();
  }, [mode, fetchPopular]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setMode("popular");
      fetchPopular();
      return;
    }
    setMode("search");
    fetchSearch(trimmed);
  };

  const clearSearch = () => {
    setQuery("");
    setMode("popular");
    fetchPopular();
  };

  // Keep onOpenGame reference stable; we don't actually need to invoke it
  // because each card links directly to roblox.com.
  void onOpenGame;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-brand" />
          Game discovery
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse a curated feed of experiences from well-known Roblox
          developers. Search filters the catalog locally — Roblox&apos;s own
          game-search endpoint requires auth.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, creator, or keyword (e.g. crossroads, piggy, murder)"
            className="h-11 pl-10 pr-9"
            aria-label="Search games"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 px-6 bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Search
            </>
          )}
        </Button>
        {mode === "popular" && !loading && (
          <Button
            type="button"
            variant="outline"
            onClick={fetchPopular}
            className="h-11"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </form>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {mode === "popular" ? (
            <>
              <UiBadge variant="outline" className="bg-brand-muted/40 border-brand/30">
                Popular
              </UiBadge>
              <span>
                {loading ? "Loading…" : `${games.length} games from curated developers`}
              </span>
            </>
          ) : (
            <>
              <UiBadge variant="outline">
                Search: &ldquo;{query}&rdquo;
              </UiBadge>
              <span>
                {loading ? "Searching…" : `${games.length} matches`}
              </span>
            </>
          )}
        </div>
        {mode === "search" && games.length === 0 && !loading && !error && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Roblox&apos;s full-text game search is locked behind auth — try a
            different keyword or browse popular.
          </p>
        )}
      </div>

      {error ? (
        <Card className="p-6 text-center text-sm text-muted-foreground border-destructive/40 bg-destructive/5">
          <p className="text-destructive mb-1">Couldn&apos;t load games</p>
          <p className="text-xs">{error}</p>
          <Button onClick={() => (mode === "search" ? fetchSearch(query) : fetchPopular())} variant="outline" size="sm" className="mt-3">
            <RefreshCw className="h-3 w-3 mr-1.5" /> Retry
          </Button>
        </Card>
      ) : loading ? (
        <GameGridSkeleton count={12} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70 text-center">
        <Calendar className="inline h-3 w-3 mr-1" />
        Feed refreshes every 5 minutes. Click any game to open it on roblox.com.
      </p>
    </section>
  );
}
