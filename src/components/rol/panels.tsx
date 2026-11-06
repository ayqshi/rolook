"use client";

import * as React from "react";
import {
  Award,
  Box,
  ExternalLink,
  Gamepad2,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared empty / error / loading states                               */
/* ------------------------------------------------------------------ */

function StateWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

function LoadingGrid({ count = 12, kind = "circle" }: { count?: number; kind?: "circle" | "square" | "row" }) {
  if (kind === "row") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-3 flex gap-3">
            <Skeleton className="h-12 w-12 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-3 flex flex-col items-center gap-2">
          <Skeleton className={cn(kind === "circle" ? "h-14 w-14 rounded-full" : "h-12 w-12 rounded-md")} />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-12" />
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <StateWrap>
      <Shield className="h-8 w-8 mb-2 text-muted-foreground" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 text-muted-foreground/80">
        Roblox may be rate-limiting this request. Try again in a moment.
      </p>
    </StateWrap>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Users;
  title: string;
  hint?: string;
}) {
  return (
    <StateWrap>
      <Icon className="h-8 w-8 mb-2 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs mt-1 text-muted-foreground">{hint}</p>}
    </StateWrap>
  );
}

/**
 * Friendly "Roblox requires login" panel used for friends, followers,
 * following, badges and inventory — Roblox locked these LIST endpoints
 * behind authentication in 2024-2026. We expose the public COUNT when
 * available and link out to the user's Roblox page for the full list.
 */
function LockedPanel({
  icon: Icon,
  count,
  countLabel,
  robloxUrl,
  robloxLabel,
  hint,
}: {
  icon: typeof Users;
  count?: number | null;
  countLabel: string;
  robloxUrl: string;
  robloxLabel: string;
  hint: string;
}) {
  return (
    <Card className="p-6 md:p-8 flex flex-col items-center text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted grid place-items-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <div className="flex items-center gap-2 justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-medium">{countLabel}</h3>
        </div>
        {typeof count === "number" ? (
          <p className="text-3xl font-semibold tabular-nums mt-2">
            {count.toLocaleString()}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground max-w-md">{hint}</p>
      <Button asChild size="sm" className="mt-1 bg-brand text-brand-foreground hover:bg-brand/90">
        <a href={robloxUrl} target="_blank" rel="noopener noreferrer">
          {robloxLabel}
          <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </a>
      </Button>
    </Card>
  );
}

function useFetch<T>(
  url: string | null,
  deps: React.DependencyList = [],
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(async (r) => {
        const json = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setError(json.error || `Request failed (${r.status})`);
          setData(null);
        } else {
          setData(json as T);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Network error");
      })
      .finally(() => !cancelled && setLoading(false));
     
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

/* ------------------------------------------------------------------ */
/* Friends / Followers / Following — locked behind auth                */
/* ------------------------------------------------------------------ */

export function FriendsPanel({
  userId,
  count,
}: {
  userId: number;
  count?: number | null;
}) {
  return (
    <LockedPanel
      icon={Users}
      count={count}
      countLabel="Friends"
      robloxUrl={`https://www.roblox.com/users/${userId}/friends`}
      robloxLabel="View friends on Roblox"
      hint="Roblox hides the full friends list from public APIs (HTTP 403). The count above is the latest cached value Roblox exposes — open the user's friends page on Roblox to see individual friends."
    />
  );
}

export function FollowersPanel({
  userId,
  count,
}: {
  userId: number;
  count?: number | null;
}) {
  return (
    <LockedPanel
      icon={Users}
      count={count}
      countLabel="Followers"
      robloxUrl={`https://www.roblox.com/users/${userId}/friends`}
      robloxLabel="View followers on Roblox"
      hint="Roblox requires authentication to read the followers list (HTTP 401). The count above is the public cached value — open the user's profile on Roblox to browse followers."
    />
  );
}

export function FollowingPanel({
  userId,
  count,
}: {
  userId: number;
  count?: number | null;
}) {
  return (
    <LockedPanel
      icon={Users}
      count={count}
      countLabel="Following"
      robloxUrl={`https://www.roblox.com/users/${userId}/friends`}
      robloxLabel="View who they follow on Roblox"
      hint="Roblox requires authentication to read the following list (HTTP 401). The count above is the public cached value — open the user's profile on Roblox to see who they follow."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Badges — locked behind auth since March 2026                        */
/* ------------------------------------------------------------------ */

export function BadgesPanel({ userId }: { userId: number }) {
  return (
    <LockedPanel
      icon={Award}
      countLabel="Badges"
      robloxUrl={`https://www.roblox.com/users/${userId}/inventory`}
      robloxLabel="View badges on Roblox"
      hint="Roblox disabled unauthenticated access to badge lists (HTTP 401) as part of the 2026 privacy changes. Open the user's badges page on Roblox to see earned badges."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Inventory (collectibles) — locked behind auth                       */
/* ------------------------------------------------------------------ */

export function InventoryPanel({ userId }: { userId: number }) {
  return (
    <LockedPanel
      icon={Box}
      countLabel="Collectibles"
      robloxUrl={`https://www.roblox.com/users/${userId}/inventory`}
      robloxLabel="View inventory on Roblox"
      hint="Roblox requires authentication to read the inventory / collectibles list (HTTP 401). If the user has made their inventory public, you can browse it directly on their Roblox profile."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Groups — still public                                               */
/* ------------------------------------------------------------------ */

export function GroupsPanel({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch<{
    data: {
      group: {
        id: number;
        name: string;
        memberCount: number;
        hasVerifiedBadge: boolean;
      };
      role: { id: number; name: string; rank: number };
      iconUrl: string | null;
    }[];
    count: number;
  }>(`/api/groups?userId=${userId}`);

  if (loading && !data) return <LoadingGrid count={6} kind="row" />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.data.length === 0)
    return (
      <EmptyState
        icon={Shield}
        title="No group memberships"
        hint="This user is not a member of any Roblox group."
      />
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.data.map((g) => (
        <Card key={g.group.id} className="p-3 flex items-center gap-3 hover:bg-accent/40 transition-colors">
          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
            {g.iconUrl && (
               
              <img src={g.iconUrl} alt={g.group.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <a
                href={`https://www.roblox.com/communities/${g.group.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm truncate hover:underline"
              >
                {g.group.name}
              </a>
              {g.group.hasVerifiedBadge && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-500 shrink-0" fill="currentColor">
                  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {g.role.name} · Rank {g.role.rank}
            </div>
            <div className="text-xs text-muted-foreground">
              {g.group.memberCount.toLocaleString()} members
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Games — still public                                                */
/* ------------------------------------------------------------------ */

export function GamesPanel({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch<{
    data: {
      id: number;
      name: string;
      description: string | null;
      placeVisits: number;
      created: string;
      updated: string;
      iconUrl: string | null;
    }[];
    count: number;
  }>(`/api/games?userId=${userId}`);

  if (loading && !data) return <LoadingGrid count={6} kind="row" />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.data.length === 0)
    return (
      <EmptyState
        icon={Gamepad2}
        title="No public experiences"
        hint="This user hasn't published any Roblox experiences, or they are private."
      />
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.data.map((g) => (
        <Card key={g.id} className="p-3 flex gap-3 hover:bg-accent/40 transition-colors">
          <div className="h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0">
            {g.iconUrl && (
               
              <img src={g.iconUrl} alt={g.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.roblox.com/discover?userId=${userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm truncate hover:underline block"
            >
              {g.name}
            </a>
            {g.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {g.description}
              </p>
            )}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5">
                <Gamepad2 className="h-3 w-3" />
                {g.placeVisits.toLocaleString()} visits
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
