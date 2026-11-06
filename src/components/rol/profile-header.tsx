"use client";

import * as React from "react";
import {
  BadgeCheck,
  Ban,
  Calendar,
  Gamepad2,
  Globe,
  Hash,
  Loader2,
  MapPin,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ProfileHeaderData = {
  user: {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    created: string;
    isBanned: boolean;
    hasVerifiedBadge: boolean;
    externalAppDisplayName: string | null;
  };
  presence: {
    userPresenceType: number;
    lastLocation: string;
    lastOnline: string;
    placeId: number | null;
    rootPlaceId: number | null;
    universeId: number | null;
  } | null;
  presenceLabel: { label: string; color: string } | null;
  status: string | null;
  headshot: string | null;
  avatar: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 60) return "just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 30) return `${day}d ago`;
    return formatDate(iso);
  } catch {
    return iso;
  }
}

export function ProfileHeader({
  data,
  loading,
}: {
  data: ProfileHeaderData | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <div className="rounded-xl border bg-card p-6 flex flex-col md:flex-row gap-6">
        <div className="h-28 w-28 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, presence, presenceLabel, status, headshot, avatar } = data;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="h-24 md:h-28 bg-gradient-to-r from-brand-muted via-card to-card border-b" />
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="relative -mt-16 md:-mt-20 shrink-0 self-start">
          <div className="rounded-full border-4 border-card overflow-hidden bg-muted h-28 w-28 md:h-32 md:w-32">
            {headshot ? (
               
              <img
                src={headshot}
                alt={`${user.displayName}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          {presenceLabel && (
            <div
              className={cn(
                "absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-card",
                presenceLabel.color.includes("emerald")
                  ? "bg-emerald-500"
                  : presenceLabel.color.includes("sky")
                    ? "bg-sky-500"
                    : "bg-muted-foreground/40",
              )}
              title={presenceLabel.label}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight break-words">
              {user.displayName}
            </h1>
            {user.hasVerifiedBadge && (
              <BadgeCheck className="h-5 w-5 text-sky-500 shrink-0" aria-label="Verified" />
            )}
            {user.isBanned && (
              <Badge variant="destructive" className="gap-1">
                <Ban className="h-3 w-3" /> Banned
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-foreground">@{user.name}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {user.id}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDate(user.created)}
            </span>
            {presenceLabel && (
              <span className={cn("inline-flex items-center gap-1 font-medium", presenceLabel.color)}>
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                {presenceLabel.label}
              </span>
            )}
          </div>

          {presence?.lastLocation && presence.userPresenceType !== 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Gamepad2 className="h-3.5 w-3.5 text-brand" />
              <span className="truncate">Playing {presence.lastLocation}</span>
            </div>
          )}

          {presence?.lastOnline && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              Last online {formatRelative(presence.lastOnline)}
            </div>
          )}

          {status && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground border-l-2 border-brand">
              &ldquo;{status}&rdquo;
            </div>
          )}

          {user.description && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {user.description}
            </div>
          )}
          {!user.description && !status && (
            <div className="text-sm text-muted-foreground italic flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> No description or status set.
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`https://www.roblox.com/users/${user.id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors"
            >
              View on Roblox ↗
            </a>
            {avatar && (
              <a
                href={avatar}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors"
              >
                Full avatar ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
