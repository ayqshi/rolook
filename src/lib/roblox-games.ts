/**
 * Roblox game discovery + group/badge helpers used by the public v1 API.
 *
 * Roblox locked most game-discovery endpoints (search, sorts, multiget
 * place-details) behind authentication in 2024-2025. The only public,
 * reliable game endpoints are:
 *
 *   • games.roblox.com/v1/games?universeIds=…        — bulk game details
 *   • games.roblox.com/v2/users/{userId}/games        — games by creator
 *   • thumbnails.roblox.com/v1/games/icons            — game icons
 *   • thumbnails.roblox.com/v1/games/multiget/thumbnails — game screenshots
 *
 * To power a "popular games" feed without auth we keep a curated list of
 * well-known Roblox game developers, fetch each developer's published
 * experiences, aggregate them, and sort by visit count. The result is
 * cached for a few minutes.
 */

import {
  rbFetch,
  isRobloxError,
  type RobloxError,
} from "./roblox";

// Re-export so routes can pull everything from one module.
export { isRobloxError, type RobloxError };

export type GameSummary = {
  id: number; // universeId
  rootPlaceId: number;
  name: string;
  description: string | null;
  creator: { id: number; name: string; type: "User" | "Group"; hasVerifiedBadge: boolean };
  price: number | null;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  favoritedCount: number;
  genre: string | null;
};

export type GameWithIcon = GameSummary & {
  iconUrl: string | null;
};

/* ------------------------------------------------------------------ */
/* Curated popular developers                                          */
/* ------------------------------------------------------------------ */

/**
 * A small set of well-known Roblox game developers, hand-picked to seed
 * the popular feed. We resolve their userId once and cache it.
 */
const POPULAR_DEVELOPER_USERNAMES = [
  "Roblox",
  "Shedletsky",
  "builderman",
  "DreamCraft",
  "alexnewtron",
  "Coeptus",
  "asimo3089",
  "badcc",
  "MiniToon",
  "ROLVe",
  "Nikilis",
  "Arbiteur",
];

type CachedDev = { username: string; userId: number; fetchedAt: number };
let cachedDevs: CachedDev[] = [];
let devFetchPromise: Promise<CachedDev[]> | null = null;
const DEV_TTL_MS = 30 * 60 * 1000; // 30 min

export async function resolveDevelopers(): Promise<CachedDev[]> {
  if (cachedDevs.length > 0 && Date.now() - cachedDevs[0]!.fetchedAt < DEV_TTL_MS) {
    return cachedDevs;
  }
  if (devFetchPromise) return devFetchPromise;

  devFetchPromise = (async () => {
    const res = await rbFetch<{ data: { id: number; name: string }[] }>(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: POPULAR_DEVELOPER_USERNAMES,
          excludeBannedUsers: false,
        }),
      },
    );
    if (isRobloxError(res)) {
      devFetchPromise = null;
      throw new Error(res.error);
    }
    const now = Date.now();
    cachedDevs = (res as { data: { id: number; name: string }[] }).data.map(
      (u) => ({ username: u.name, userId: u.id, fetchedAt: now }),
    );
    devFetchPromise = null;
    return cachedDevs;
  })();

  return devFetchPromise;
}

/* ------------------------------------------------------------------ */
/* Per-developer games                                                 */
/* ------------------------------------------------------------------ */

type RawGame = {
  id: number;
  name: string;
  description: string | null;
  creator: { id: number; type: "User" | "Group" };
  rootPlace: { id: number };
  created: string;
  updated: string;
  placeVisits: number;
};

async function getDeveloperGames(userId: number): Promise<RawGame[]> {
  const url = new URL(`https://games.roblox.com/v2/users/${userId}/games`);
  url.searchParams.set("accessFilter", "2");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sortOrder", "Desc");
  const res = await rbFetch<{ data: RawGame[] }>(url.toString());
  if (isRobloxError(res)) return [];
  return (res as { data: RawGame[] }).data ?? [];
}

/* ------------------------------------------------------------------ */
/* Bulk game details                                                   */
/* ------------------------------------------------------------------ */

export async function getGamesByUniverseIds(
  universeIds: number[],
): Promise<GameSummary[]> {
  if (universeIds.length === 0) return [];
  // Roblox caps /v1/games?universeIds= at 50 IDs per request (returns the
  // first 50 and silently drops the rest). Chunk accordingly.
  const chunks: number[][] = [];
  for (let i = 0; i < universeIds.length; i += 50) {
    chunks.push(universeIds.slice(i, i + 50));
  }
  const results: GameSummary[] = [];
  for (const chunk of chunks) {
    const url = `https://games.roblox.com/v1/games?universeIds=${chunk.join(",")}`;
    const res = await rbFetch<{ data: GameSummary[] }>(url);
    if (!isRobloxError(res)) {
      const data = (res as { data: GameSummary[] }).data ?? [];
      results.push(...data);
    }
  }
  return results;
}

export async function getGameByUniverseId(
  universeId: number,
): Promise<GameSummary | RobloxError> {
  const arr = await getGamesByUniverseIds([universeId]);
  if (arr.length === 0) return { error: "Game not found", status: 404 };
  return arr[0]!;
}

/* ------------------------------------------------------------------ */
/* Game icons (thumbnails)                                             */
/* ------------------------------------------------------------------ */

export async function getGameIcons(
  universeIds: number[],
  size = "256x256",
): Promise<Record<number, string>> {
  if (universeIds.length === 0) return {};
  const out: Record<number, string> = {};
  // Chunk by 50 — Roblox silently drops IDs beyond the per-request cap.
  for (let i = 0; i < universeIds.length; i += 50) {
    const chunk = universeIds.slice(i, i + 50);
    const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunk.join(
      ",",
    )}&size=${size}&format=Png&isCircular=false`;
    const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(url);
    if (isRobloxError(res)) continue;
    for (const d of (res as { data: { targetId: number; imageUrl: string }[] }).data) {
      out[d.targetId] = d.imageUrl;
    }
  }
  return out;
}

export async function getGameThumbnails(
  universeIds: number[],
  size = "512x288",
): Promise<Record<number, string[]>> {
  if (universeIds.length === 0) return {};
  const out: Record<number, string[]> = {};
  for (let i = 0; i < universeIds.length; i += 50) {
    const chunk = universeIds.slice(i, i + 50);
    const url = `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${chunk.join(
      ",",
    )}&countPerUniverse=2&defaults=true&size=${size}&format=Png&isCircular=false`;
    const res = await rbFetch<{
      data: { universeId: number; thumbnails: { imageUrl: string }[] }[];
    }>(url);
    if (isRobloxError(res)) continue;
    for (const d of (res as { data: { universeId: number; thumbnails: { imageUrl: string }[] }[] }).data) {
      out[d.universeId] = d.thumbnails.map((t) => t.imageUrl);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Popular games feed (cached)                                         */
/* ------------------------------------------------------------------ */

let popularCache: { fetchedAt: number; games: GameWithIcon[] } | null = null;
const POPULAR_TTL_MS = 5 * 60 * 1000; // 5 min
let popularFetchPromise: Promise<GameWithIcon[]> | null = null;

/**
 * Aggregate the published experiences of every curated developer, drop
 * placeholder starter places ("Foo's Place" with default name), attach
 * icon URLs, sort by visits desc, and return the top N. Cached for 5 min.
 */
export async function getPopularGames(
  limit = 60,
): Promise<GameWithIcon[]> {
  if (popularCache && Date.now() - popularCache.fetchedAt < POPULAR_TTL_MS) {
    return popularCache.games.slice(0, limit);
  }
  if (popularFetchPromise) return popularFetchPromise.then((g) => g.slice(0, limit));

  popularFetchPromise = (async () => {
    const devs = await resolveDevelopers();
    const allRaw: RawGame[] = [];
    // Fetch in parallel, but cap concurrency to avoid hammering Roblox
    const BATCH = 4;
    for (let i = 0; i < devs.length; i += BATCH) {
      const slice = devs.slice(i, i + BATCH);
      const results = await Promise.all(
        slice.map((d) => getDeveloperGames(d.userId).catch(() => [])),
      );
      for (const r of results) allRaw.push(...r);
    }

    // Filter out starter placeholders ("X's Place" or "Foo's Place Number: N")
    const meaningful = allRaw.filter(
      (g) =>
        g.rootPlace &&
        g.name &&
        !/^[\w._-]+['’]?s Place( Number: \d+)?$/.test(g.name) &&
        g.placeVisits >= 100,
    );

    // De-duplicate by universe id
    const byId = new Map<number, RawGame>();
    for (const g of meaningful) {
      const existing = byId.get(g.id);
      if (!existing || (g.placeVisits ?? 0) > (existing.placeVisits ?? 0)) {
        byId.set(g.id, g);
      }
    }
    const unique = Array.from(byId.values()).sort(
      (a, b) => (b.placeVisits ?? 0) - (a.placeVisits ?? 0),
    );

    const universeIds = unique.map((g) => g.id);
    const details = await getGamesByUniverseIds(universeIds);
    const detailMap = new Map(details.map((d) => [d.id, d]));
    const icons = await getGameIcons(universeIds);

    const games: GameWithIcon[] = unique
      .map((g) => {
        const detail = detailMap.get(g.id);
        if (!detail) return null;
        return {
          ...detail,
          iconUrl: icons[g.id] ?? null,
        } as GameWithIcon;
      })
      .filter((g): g is GameWithIcon => g !== null);

    popularCache = { fetchedAt: Date.now(), games };
    popularFetchPromise = null;
    return games;
  })();

  return popularFetchPromise.then((g) => g.slice(0, limit));
}

/**
 * Search the popular catalog for a keyword. Roblox's own game-search API
 * is locked behind auth, so we filter the curated popular list locally.
 */
export async function searchPopularGames(
  query: string,
  limit = 30,
): Promise<GameWithIcon[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getPopularGames(limit);
  const all = await getPopularGames(100);
  return all
    .filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q) ||
        g.creator.name.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Group info                                                          */
/* ------------------------------------------------------------------ */

export type GroupInfo = {
  id: number;
  name: string;
  description: string;
  owner: { userId: number; username: string; displayName: string; hasVerifiedBadge: boolean } | null;
  memberCount: number;
  isBuildersClubOnly: boolean;
  publicEntryAllowed: boolean;
  hasVerifiedBadge: boolean;
};

export async function getGroupInfo(groupId: number) {
  return rbFetch<GroupInfo>(`https://groups.roblox.com/v1/groups/${groupId}`);
}

export async function getGroupIcon(
  groupId: number,
  size = "150x150",
): Promise<string | null> {
  const url = `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=${size}&format=Png&isCircular=false`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(url);
  if (isRobloxError(res)) return null;
  return (res as { data: { targetId: number; imageUrl: string }[] }).data?.[0]?.imageUrl ?? null;
}

/* ------------------------------------------------------------------ */
/* Badge info                                                          */
/* ------------------------------------------------------------------ */

export type BadgeInfo = {
  id: number;
  name: string;
  description: string;
  displayName: string;
  displayDescription: string;
  iconImageId: number;
  displayIconImageId: number;
  awardedStatistics: {
    awardedCount: number;
    winRate: { percentage: number } | null;
  } | null;
  createdDate: string;
  updatedDate: string;
};

export async function getBadgeInfo(badgeId: number) {
  return rbFetch<BadgeInfo>(`https://badges.roblox.com/v1/badges/${badgeId}`);
}

export async function getBadgeIcon(
  badgeId: number,
  size = "150x150",
): Promise<string | null> {
  const url = `https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${badgeId}&size=${size}&format=Png&isCircular=false`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(url);
  if (isRobloxError(res)) return null;
  return (res as { data: { targetId: number; imageUrl: string }[] }).data?.[0]?.imageUrl ?? null;
}

/* ------------------------------------------------------------------ */
/* Place → universe                                                    */
/* ------------------------------------------------------------------ */

export async function getUniverseFromPlace(
  placeId: number,
): Promise<number | RobloxError> {
  const url = `https://apis.roblox.com/universes/v1/places/${placeId}/universe`;
  const res = await rbFetch<{ universeId: number | null }>(url);
  if (isRobloxError(res)) return res;
  const uid = (res as { universeId: number | null }).universeId;
  if (uid == null) return { error: "Place not found", status: 404 };
  return uid;
}
