"use client";

import * as React from "react";
import {
  Award,
  Box,
  Gamepad2,
  Lock,
  RotateCcw,
  Shield,
  Sparkles,
  Terminal,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/rol/search-bar";
import { ProfileHeader, type ProfileHeaderData } from "@/components/rol/profile-header";
import { StatCard } from "@/components/rol/stat-card";
import {
  FriendsPanel,
  FollowersPanel,
  FollowingPanel,
  GroupsPanel,
  BadgesPanel,
  GamesPanel,
  InventoryPanel,
} from "@/components/rol/panels";
import { GamesDiscovery } from "@/components/rol/games-discovery";
import { ApiDocs } from "@/components/rol/api-docs";

type LookupResult = {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
};

const RECENT_KEY = "rol-recent-searches";

type View = "users" | "games" | "api";

export default function Home() {
  const [view, setView] = React.useState<View>("users");
  const [lookup, setLookup] = React.useState<LookupResult | null>(null);
  const [profile, setProfile] = React.useState<ProfileHeaderData | null>(null);
  const [counts, setCounts] = React.useState<{
    friends: number;
    followers: number;
    following: number;
    groups: number;
    badges: number | null;
    games: number;
    inventory: number | null;
  } | null>(null);

  const [loadingLookup, setLoadingLookup] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [recent, setRecent] = React.useState<string[]>([]);

  // Load recent searches on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  // Allow ?username=foo and ?view=games|api deep-linking
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const initialView = url.searchParams.get("view");
    if (initialView === "games" || initialView === "api") {
      setView(initialView);
    }
    const u = url.searchParams.get("username");
    if (u) handleSearch(u);
     
  }, []);

  const setViewAndSync = (v: View) => {
    setView(v);
    try {
      const url = new URL(window.location.href);
      if (v === "users") url.searchParams.delete("view");
      else url.searchParams.set("view", v);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  };

  const handleSearch = React.useCallback(
    async (rawUsername: string) => {
      const username = rawUsername.trim();
      if (!username) return;

      setLoadingLookup(true);
      setLoadingProfile(true);
      setError(null);
      setLookup(null);
      setProfile(null);
      setCounts(null);

      // Update URL so the search is shareable
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("username", username);
        window.history.replaceState({}, "", url.toString());
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch(
          `/api/lookup?username=${encodeURIComponent(username)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "User not found.");
          setLoadingLookup(false);
          setLoadingProfile(false);
          return;
        }
        setLookup(data);
        setLoadingLookup(false);

        // Save to recent
        const next = [username, ...recent.filter((s) => s !== username)].slice(0, 6);
        setRecent(next);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }

        // Fetch full profile
        try {
          const pRes = await fetch(`/api/profile?userId=${data.id}`);
          const pData = await pRes.json();
          if (!pRes.ok) {
            setError(pData.error || "Failed to load profile.");
          } else {
            setProfile(pData);
            setCounts(pData.counts);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load profile.");
        } finally {
          setLoadingProfile(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
        setLoadingLookup(false);
        setLoadingProfile(false);
      }
    },
    [recent],
  );

  const handleReset = () => {
    setLookup(null);
    setProfile(null);
    setCounts(null);
    setError(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("username");
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  };

  const handleClearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setViewAndSync("users");
              handleReset();
            }}
            className="flex items-center gap-2 group shrink-0"
            aria-label="Go home"
          >
            <span className="h-7 w-7 rounded-md bg-brand text-brand-foreground grid place-items-center font-bold text-sm">
              R
            </span>
            <span className="font-semibold tracking-tight hidden sm:inline">
              Ro<span className="text-brand">Lookup</span>
            </span>
          </button>

          {/* Top-level nav */}
          <nav className="flex items-center gap-1 mx-auto" aria-label="Primary">
            <NavButton
              active={view === "users"}
              onClick={() => setViewAndSync("users")}
              icon={Users}
              label="Users"
            />
            <NavButton
              active={view === "games"}
              onClick={() => setViewAndSync("games")}
              icon={Gamepad2}
              label="Games"
            />
            <NavButton
              active={view === "api"}
              onClick={() => setViewAndSync("api")}
              icon={Terminal}
              label="API"
            />
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {view === "users" && lookup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="hidden sm:inline-flex"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New search
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {view === "api" ? (
          <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
            <ApiDocs />
          </div>
        ) : view === "games" ? (
          <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
            <GamesDiscovery />
          </div>
        ) : !lookup ? (
          <Hero
            onSearch={handleSearch}
            loading={loadingLookup}
            recent={recent}
            onClearRecent={handleClearRecent}
            error={error}
            onOpenGames={() => setViewAndSync("games")}
            onOpenApi={() => setViewAndSync("api")}
          />
        ) : (
          <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6">
            {/* Top: compact search + reset */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  loading={loadingLookup}
                  size="sm"
                  initialValue={lookup.name}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="shrink-0 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            {error && (
              <Card className="p-4 border-destructive/40 bg-destructive/5 text-destructive text-sm">
                {error}
              </Card>
            )}

            <ProfileHeader data={profile} loading={loadingProfile} />

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                label="Friends"
                value={counts?.friends ?? 0}
                icon={UserCheck}
                loading={loadingProfile}
              />
              <StatCard
                label="Followers"
                value={counts?.followers ?? 0}
                icon={UserPlus}
                loading={loadingProfile}
                accent
              />
              <StatCard
                label="Following"
                value={counts?.following ?? 0}
                icon={UserMinus}
                loading={loadingProfile}
              />
              <StatCard
                label="Groups"
                value={counts?.groups ?? 0}
                icon={Shield}
                loading={loadingProfile}
              />
              <StatCard
                label="Experiences"
                value={counts?.games ?? 0}
                icon={Gamepad2}
                loading={loadingProfile}
              />
            </div>

            {/* Honest data-availability notice */}
            <Card className="p-3 text-xs text-muted-foreground flex items-start gap-2 border-dashed">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Data availability:</strong>{" "}
                Roblox locked the friends, followers, following, badges and
                inventory LIST endpoints behind authentication in 2024-2026.
                Counts above are pulled live from Roblox&apos;s public count
                endpoints; the Friends / Followers / Following / Badges /
                Collectibles tabs link out to the user&apos;s Roblox page for
                the full list. Groups and Experiences still expose their full
                lists publicly. Want this data programmatically?{" "}
                <button
                  onClick={() => setViewAndSync("api")}
                  className="text-brand underline hover:no-underline"
                >
                  See the public API →
                </button>
              </span>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="friends" className="w-full">
              <TabsList className="w-full flex-wrap h-auto justify-start overflow-x-auto scroll-thin">
                <TabsTrigger value="friends" className="flex-1 min-w-[80px]">
                  <Users className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Friends</span>
                </TabsTrigger>
                <TabsTrigger value="followers" className="flex-1 min-w-[80px]">
                  <UserPlus className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Followers</span>
                </TabsTrigger>
                <TabsTrigger value="following" className="flex-1 min-w-[80px]">
                  <UserMinus className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Following</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex-1 min-w-[80px]">
                  <Shield className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Groups</span>
                </TabsTrigger>
                <TabsTrigger value="badges" className="flex-1 min-w-[80px]">
                  <Award className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Badges</span>
                </TabsTrigger>
                <TabsTrigger value="games" className="flex-1 min-w-[80px]">
                  <Gamepad2 className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Games</span>
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex-1 min-w-[80px]">
                  <Box className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Collectibles</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="mt-4">
                <FriendsPanel userId={lookup.id} count={counts?.friends} />
              </TabsContent>
              <TabsContent value="followers" className="mt-4">
                <FollowersPanel userId={lookup.id} count={counts?.followers} />
              </TabsContent>
              <TabsContent value="following" className="mt-4">
                <FollowingPanel userId={lookup.id} count={counts?.following} />
              </TabsContent>
              <TabsContent value="groups" className="mt-4">
                <GroupsPanel userId={lookup.id} />
              </TabsContent>
              <TabsContent value="badges" className="mt-4">
                <BadgesPanel userId={lookup.id} />
              </TabsContent>
              <TabsContent value="games" className="mt-4">
                <GamesPanel userId={lookup.id} />
              </TabsContent>
              <TabsContent value="inventory" className="mt-4">
                <InventoryPanel userId={lookup.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">RoLookup</span> ·
            Unofficial tool that reads public Roblox APIs. Not affiliated with
            Roblox Corporation.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewAndSync("api")}
              className="hover:text-foreground transition-colors"
            >
              REST API
            </button>
            <span aria-hidden>·</span>
            <button
              onClick={() => setViewAndSync("games")}
              className="hover:text-foreground transition-colors"
            >
              Game discovery
            </button>
            <span aria-hidden>·</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Built with Next.js &amp; shadcn/ui
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nav button (header)                                                 */
/* ------------------------------------------------------------------ */

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors " +
        (active
          ? "bg-brand-muted text-brand font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent")
      }
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Hero (no user loaded)                                               */
/* ------------------------------------------------------------------ */

function Hero({
  onSearch,
  loading,
  recent,
  onClearRecent,
  error,
  onOpenGames,
  onOpenApi,
}: {
  onSearch: (q: string) => void;
  loading: boolean;
  recent: string[];
  onClearRecent: () => void;
  error: string | null;
  onOpenGames: () => void;
  onOpenApi: () => void;
}) {
  return (
    <section className="relative">
      <div className="absolute inset-0 hero-glow pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3 w-3 text-brand" />
          Public Roblox profile explorer &amp; open API
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Search any <span className="text-brand">Roblox</span> username.
          <br className="hidden md:block" />
          See everything available.
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Profile, friends, followers, groups, badges, experiences and
          collectibles — pulled live from Roblox public APIs into one
          dashboard.
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar
            onSearch={onSearch}
            loading={loading}
            size="lg"
            autoFocus
            recent={recent}
            onClearRecent={onClearRecent}
          />
        </div>

        {error && (
          <Card className="mt-6 p-4 border-destructive/40 bg-destructive/5 text-destructive text-sm text-left max-w-xl mx-auto">
            <strong>Couldn't look up that user:</strong> {error}
          </Card>
        )}

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
          {[
            { icon: UserCheck, label: "Friends" },
            { icon: UserPlus, label: "Followers" },
            { icon: Shield, label: "Groups" },
            { icon: Award, label: "Badges" },
            { icon: Gamepad2, label: "Experiences" },
            { icon: Box, label: "Collectibles" },
            { icon: Sparkles, label: "Live presence" },
            { icon: Users, label: "Avatar render" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-lg border bg-card p-3 flex items-center gap-2"
            >
              <Icon className="h-4 w-4 text-brand" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Try a well-known username like{" "}
          <button
            onClick={() => onSearch("builderman")}
            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono"
          >
            builderman
          </button>
          ,{" "}
          <button
            onClick={() => onSearch("Roblox")}
            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono"
          >
            Roblox
          </button>{" "}
          or{" "}
          <button
            onClick={() => onSearch("Shedletsky")}
            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono"
          >
            Shedletsky
          </button>
          .
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            onClick={onOpenGames}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-brand" />
            Discover popular games
          </button>
          <button
            onClick={onOpenApi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-brand" />
            Read the API docs
          </button>
        </div>
      </div>
    </section>
  );
}
