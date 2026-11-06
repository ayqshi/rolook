"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Endpoint = {
  method: "GET";
  path: string;
  description: string;
  params?: string;
  example: string;
  sampleResponse?: string;
};

const ENDPOINTS: { group: string; items: Endpoint[] }[] = [
  {
    group: "Users",
    items: [
      {
        method: "GET",
        path: "/api/v1/users/lookup?username={username}",
        description:
          "Resolve a Roblox username to its userId + basic identity. The building block for every other user endpoint.",
        params: "username (required) — Roblox username, case-insensitive.",
        example: "curl 'https://YOUR_HOST/api/v1/users/lookup?username=Shedletsky'",
        sampleResponse:
          '{"id":261,"name":"Shedletsky","displayName":"Shedletsky","hasVerifiedBadge":true}',
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}?include=presence,counts,groups,games,thumbnail,status",
        description:
          "Full Roblox user profile. Returns the user object by default; pass any subset of includes to attach sub-resources in one round-trip.",
        params:
          "userId (path, required) — numeric Roblox user id.\ninclude (optional) — comma-separated: presence, counts, groups, games, thumbnail, status.",
        example:
          "curl 'https://YOUR_HOST/api/v1/users/261?include=counts,presence,thumbnail'",
        sampleResponse:
          '{"user":{"id":261,"name":"Shedletsky","displayName":"Shedletsky","description":"…","created":"2006-06-22T01:33:56.45Z","isBanned":false,"hasVerifiedBadge":true},"counts":{"friends":98,"followers":2122265,"following":457721,"groups":33,"games":50},"presence":{"userPresenceType":0,"lastLocation":"Website","lastOnline":"2026-11-06T21:55:00Z"},"thumbnail":"https://tr.rbxcdn.com/…"}',
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}/presence",
        description:
          "Live presence (offline / online / in-game / in-studio), last location, last online timestamp, and the user's free-text status.",
        example: "curl 'https://YOUR_HOST/api/v1/users/261/presence'",
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}/counts",
        description:
          "Public counts for friends, followers, following, groups and games. Roblox hides the lists themselves behind auth — counts remain public.",
        example: "curl 'https://YOUR_HOST/api/v1/users/261/counts'",
        sampleResponse:
          '{"friends":98,"followers":2122265,"following":457721,"groups":33,"games":50}',
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}/groups",
        description:
          "Full list of group memberships with role name, rank, member count, verified badge, and group icon URL.",
        example: "curl 'https://YOUR_HOST/api/v1/users/261/groups'",
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}/games",
        description:
          "The user's published experiences (universe id, root place id, name, description, visit count, created, updated) with icon URLs.",
        example: "curl 'https://YOUR_HOST/api/v1/users/261/games'",
      },
      {
        method: "GET",
        path: "/api/v1/users/{userId}/thumbnail?kind=headshot&size=420x420",
        description:
          "Avatar render URL. kind = headshot | avatar | bust. Roblox-allowed sizes: 48x48, 60x60, 100x100, 150x150, 180x180, 352x352, 420x420, 720x720.",
        params:
          "kind (optional, default headshot) — headshot | avatar | bust.\nsize (optional, default 420x420).",
        example: "curl 'https://YOUR_HOST/api/v1/users/261/thumbnail?kind=avatar'",
      },
    ],
  },
  {
    group: "Games",
    items: [
      {
        method: "GET",
        path: "/api/v1/games/popular?limit=24",
        description:
          "Curated popular feed: aggregates published experiences from a hand-picked list of well-known Roblox developers, drops starter placeholders, sorts by visit count desc, attaches icons. Cached 5 min.",
        params: "limit (optional, default 24, max 100).",
        example: "curl 'https://YOUR_HOST/api/v1/games/popular?limit=12'",
      },
      {
        method: "GET",
        path: "/api/v1/games/search?q={keyword}&limit=24",
        description:
          "Search the curated popular catalog by name, description, or creator. Roblox's own game-search endpoint is locked behind auth, so this filters locally.",
        params: "q (required) — search keyword.\nlimit (optional, default 24, max 100).",
        example: "curl 'https://YOUR_HOST/api/v1/games/search?q=crossroads'",
      },
      {
        method: "GET",
        path: "/api/v1/games/{universeId}?include=icon,thumbnails",
        description:
          "Full game detail (name, description, creator, playing, visits, max players, created, updated, favoritedCount, genre).",
        params:
          "universeId (path, required).\ninclude (optional) — comma-separated: icon, thumbnails.",
        example: "curl 'https://YOUR_HOST/api/v1/games/13058?include=icon'",
      },
      {
        method: "GET",
        path: "/api/v1/games/{universeId}/icon?size=256x256",
        description: "Game icon URL. Sizes: 50x50, 128x128, 150x150, 256x256, 512x512.",
        example: "curl 'https://YOUR_HOST/api/v1/games/13058/icon'",
      },
      {
        method: "GET",
        path: "/api/v1/games/{universeId}/thumbnail?size=512x288",
        description: "Game screenshot URLs (array of 2).",
        example: "curl 'https://YOUR_HOST/api/v1/games/13058/thumbnail'",
      },
      {
        method: "GET",
        path: "/api/v1/games/place/{placeId}",
        description:
          "Resolve a Roblox place ID (the number in roblox.com/games/{placeId} URLs) to its parent universe + game details.",
        example: "curl 'https://YOUR_HOST/api/v1/games/place/1818'",
      },
    ],
  },
  {
    group: "Groups",
    items: [
      {
        method: "GET",
        path: "/api/v1/groups/{groupId}?include=icon",
        description:
          "Group metadata (name, description, owner, memberCount, public entry, verified badge). Set include=icon for the icon URL.",
        example: "curl 'https://YOUR_HOST/api/v1/groups/3049798?include=icon'",
      },
      {
        method: "GET",
        path: "/api/v1/groups/{groupId}/icon?size=150x150",
        description: "Group icon URL. Sizes: 150x150, 420x420.",
        example: "curl 'https://YOUR_HOST/api/v1/groups/3049798/icon'",
      },
    ],
  },
  {
    group: "Badges",
    items: [
      {
        method: "GET",
        path: "/api/v1/badges/{badgeId}?include=icon",
        description:
          "Badge metadata (name, description, icon image id, awarded statistics, created/updated). Set include=icon for the icon URL. Per-user badge lists require auth.",
        example: "curl 'https://YOUR_HOST/api/v1/badges/2124866060?include=icon'",
      },
      {
        method: "GET",
        path: "/api/v1/badges/{badgeId}/icon?size=150x150",
        description: "Badge icon URL. Sizes: 150x150.",
        example: "curl 'https://YOUR_HOST/api/v1/badges/2124866060/icon'",
      },
    ],
  },
  {
    group: "Health & meta",
    items: [
      {
        method: "GET",
        path: "/api/v1/health",
        description: "Liveness check. Not rate-limited.",
        example: "curl 'https://YOUR_HOST/api/v1/health'",
        sampleResponse:
          '{"status":"ok","service":"rol-lookup","version":"1","time":"2026-11-06T21:55:00.000Z"}',
      },
    ],
  },
];

function CopyableCode({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="relative group">
      <pre className="text-xs bg-muted rounded-md p-3 pr-9 overflow-x-auto scroll-thin font-mono">
        <code data-language={language}>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shrink-0",
        method === "GET" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      )}
    >
      {method}
    </span>
  );
}

export function ApiDocs() {
  const [host, setHost] = React.useState("https://YOUR_HOST");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.origin);
    }
  }, []);

  const renderExample = (example: string) => example.replace(/https:\/\/YOUR_HOST/g, host);

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Terminal className="h-6 w-6 text-brand" />
          Public REST API
        </h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Every piece of data shown in the user interface is also exposed as a
          JSON REST endpoint under <code className="px-1 py-0.5 rounded bg-muted text-xs">/api/v1</code>.
          No API key required. Use it from any other website, server, bot, or
          data pipeline.
        </p>
      </div>

      {/* Quick start */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Quick start
        </h3>
        <p className="text-sm">
          All endpoints return JSON. Base URL:{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{host}</code>
        </p>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Resolve a username:</p>
          <CopyableCode code={renderExample("curl 'https://YOUR_HOST/api/v1/users/lookup?username=Shedletsky'")} />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Fetch a full profile in a single call:
          </p>
          <CopyableCode
            code={renderExample(
              "curl 'https://YOUR_HOST/api/v1/users/261?include=counts,presence,thumbnail,groups,games'",
            )}
          />
        </div>
      </Card>

      {/* Rate limiting */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Rate limiting
        </h3>
        <p className="text-sm">
          Generous per-IP token bucket: <strong>60 requests burst</strong>,
          refilled at <strong>1 request / second</strong> (~3,600/hour). Enough
          for a typical website first paint (profile + 5 tab loads ≈ 6 calls)
          with plenty of headroom.
        </p>
        <p className="text-sm">Every response includes these headers:</p>
        <CopyableCode
          language="http"
          code={`X-RateLimit-Limit:     60        # bucket capacity (burst)
X-RateLimit-Remaining: 58        # tokens remaining
X-RateLimit-Reset:     1794002322  # unix sec when bucket next refills to ≥1`}
        />
        <p className="text-sm">When you exceed the limit you get a 429:</p>
        <CopyableCode
          language="http"
          code={`HTTP/1.1 429 Too Many Requests
Retry-After: 2
Content-Type: application/json

{"error":"Rate limit exceeded. Slow down and retry shortly.","status":429,"retryAfter":2}`}
        />
      </Card>

      {/* Error format */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Error format
        </h3>
        <p className="text-sm">
          All errors return a stable JSON envelope with an HTTP status code in
          the 4xx–5xx range:
        </p>
        <CopyableCode
          language="json"
          code={`{
  "error": "Roblox responded with 404",
  "status": 404
}`}
        />
        <p className="text-xs text-muted-foreground">
          Common statuses: 400 (bad input), 404 (user / game / group not found),
          429 (rate limit), 502 (Roblox upstream failure), 500 (server error).
        </p>
      </Card>

      {/* Endpoints by group */}
      {ENDPOINTS.map((group) => (
        <div key={group.group} className="space-y-3">
          <h3 className="font-semibold text-lg">{group.group}</h3>
          <div className="space-y-3">
            {group.items.map((ep) => (
              <Card key={ep.path} className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <MethodBadge method={ep.method} />
                  <code className="text-sm font-mono break-all leading-6">
                    {ep.path}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.description}</p>
                {ep.params && (
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                    {ep.params}
                  </pre>
                )}
                <CopyableCode code={renderExample(ep.example)} />
                {ep.sampleResponse && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Sample response
                    </summary>
                    <CopyableCode language="json" code={ep.sampleResponse} />
                  </details>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* JS example */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          JavaScript example (browser)
        </h3>
        <p className="text-sm">
          The API supports CORS for browser-side use. Note that{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-xs">/api/v1/*</code>{" "}
          routes are rate-limited per client IP, so direct browser calls share
          the visitor&apos;s bucket.
        </p>
        <CopyableCode
          language="javascript"
          code={`// Resolve a Roblox username and fetch its full profile
const username = "Shedletsky";
const lookupRes = await fetch(\`${host}/api/v1/users/lookup?username=\${username}\`);
if (!lookupRes.ok) throw new Error((await lookupRes.json()).error);
const { id } = await lookupRes.json();

const profileRes = await fetch(
  \`${host}/api/v1/users/\${id}?include=counts,presence,thumbnail,games\`
);
const profile = await profileRes.json();
console.log(profile.user.displayName, profile.counts.followers, profile.thumbnail);`}
        />
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        All endpoints read public Roblox APIs. No authentication is required or
        accepted. Some Roblox upstream endpoints (per-user friends/followers/
        badges/inventory lists) were locked behind auth by Roblox in 2024-2026 —
        for those, only counts and single-item lookups are exposed.
      </p>
    </section>
  );
}
