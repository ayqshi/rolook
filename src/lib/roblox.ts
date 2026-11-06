/**
 * Server-side Roblox public API helpers.
 *
 * These are called from Next.js Route Handlers (server-side) so we bypass the
 * browser CORS restrictions entirely. All Roblox endpoints used here are
 * publicly documented and do not require authentication.
 *
 * Roblox public APIs are aggressively rate-limited and occasionally return
 * 429 / 5xx. Every helper here degrades gracefully: on failure it returns a
 * typed error object instead of throwing, so the UI can keep rendering other
 * sections.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type RobloxError = {
  error: string;
  status?: number;
};

export function isRobloxError(v: unknown): v is RobloxError {
  return (
    typeof v === "object" &&
    v !== null &&
    "error" in v &&
    typeof (v as { error: unknown }).error === "string"
  );
}

export async function rbFetch<T>(url: string, init?: RequestInit): Promise<T | RobloxError> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.roblox.com/",
        Origin: "https://www.roblox.com",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail =
          (body && (body.errors?.[0]?.message || body.message)) || "";
      } catch {
        /* ignore */
      }
      return {
        error: detail || `Roblox responded with ${res.status}`,
        status: res.status,
      };
    }

    return (await res.json()) as T;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Network error reaching Roblox",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RobloxUserLookup = {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
};

export type RobloxFullUser = {
  description: string | null;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string | null;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
};

export type RobloxThumbnail = {
  targetId: number;
  state: string;
  imageUrl: string;
};

export type RobloxPresence = {
  userPresenceType: number; // 0=offline,1=online,2=ingame,3=studio
  lastLocation: string;
  placeId: number | null;
  rootPlaceId: number | null;
  gameId: string | null;
  universeId: number | null;
  userId: number;
  lastOnline: string;
};

export type RobloxFriend = {
  id: number;
  name: string;
  displayName: string;
  isOnline: boolean;
  isDeleted: boolean;
  presenceType: number;
  hasVerifiedBadge: boolean;
  description: string | null;
};

export type RobloxGroupRole = {
  group: {
    id: number;
    name: string;
    memberCount: number;
    hasVerifiedBadge: boolean;
  };
  role: {
    id: number;
    name: string;
    rank: number;
  };
};

export type RobloxBadge = {
  id: number;
  name: string;
  description: string;
  displayName: string;
  displayDescription: string;
  iconImageId: number;
  displayIconImageId: number;
  awardedDate: string;
};

export type RobloxGame = {
  id: number; // universeId
  name: string;
  description: string | null;
  placeVisits: number;
  created: string;
  updated: string;
};

export type RobloxCollectible = {
  userAssetId: number;
  serialNumber: string | null;
  assetId: number;
  name: string;
  recentAveragePrice: number;
  originalPrice: number | null;
  assetStock: number | null;
  buildersClubJoinPrice: number | null;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function presenceLabel(t: number): {
  label: string;
  color: string;
} {
  switch (t) {
    case 1:
      return { label: "Online", color: "text-emerald-500" };
    case 2:
      return { label: "In Game", color: "text-emerald-500" };
    case 3:
      return { label: "In Studio", color: "text-sky-500" };
    default:
      return { label: "Offline", color: "text-muted-foreground" };
  }
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

/** Resolve a username (or display name) to a user id + minimal info. */
export async function lookupByUsername(
  username: string,
): Promise<RobloxUserLookup | RobloxError> {
  const cleaned = username.trim();
  if (!cleaned) return { error: "Username is required" };

  return rbFetch<RobloxUserLookup>(
    "https://users.roblox.com/v1/usernames/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [cleaned],
        excludeBannedUsers: false,
      }),
    },
  ).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as unknown as { data: RobloxUserLookup[] };
    if (!data.data || data.data.length === 0) {
      return { error: `No Roblox user found for "${cleaned}"`, status: 404 };
    }
    return data.data[0];
  });
}

export async function getUser(userId: number) {
  return rbFetch<RobloxFullUser>(`https://users.roblox.com/v1/users/${userId}`);
}

export async function getUserStatus(userId: number) {
  return rbFetch<{ status: string | null }>(
    `https://users.roblox.com/v1/users/${userId}/status`,
  );
}

export async function getPresence(userId: number) {
  return rbFetch<{ userPresences: RobloxPresence[] }>(
    "https://presence.roblox.com/v1/presence/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    },
  ).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { userPresences: RobloxPresence[] };
    return data.userPresences?.[0] ?? null;
  });
}

export type ThumbnailKind = "headshot" | "avatar" | "bust";

export async function getThumbnail(
  userId: number,
  kind: ThumbnailKind = "headshot",
) {
  const host =
    kind === "headshot"
      ? "https://thumbnails.roblox.com/v1/users/avatar-headshot"
      : kind === "bust"
        ? "https://thumbnails.roblox.com/v1/users/avatar-bust"
        : "https://thumbnails.roblox.com/v1/users/avatar";
  const url = `${host}?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
  return rbFetch<{ data: RobloxThumbnail[] }>(url).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxThumbnail[] };
    return data.data?.[0]?.imageUrl ?? null;
  });
}

export async function getFriends(userId: number) {
  return rbFetch<{ data: RobloxFriend[] }>(
    `https://friends.roblox.com/v1/users/${userId}/friends`,
  ).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxFriend[] };
    return data.data ?? [];
  });
}

/**
 * Returns the public friend count for a user.
 *
 * NOTE: Roblox returns the cached count even for unauthenticated requests,
 * but the actual friends LIST endpoint requires authentication (returns
 * 403 "Request Context Failure"). So we expose only the count to the UI
 * and link out to roblox.com for the full list.
 */
export async function getFriendsCount(userId: number) {
  return rbFetch<{ count: number }>(
    `https://friends.roblox.com/v1/users/${userId}/friends/count`,
  ).then((res) => (isRobloxError(res) ? res : (res as { count: number }).count));
}

export async function getFollowersCount(userId: number) {
  return rbFetch<{ count: number }>(
    `https://friends.roblox.com/v1/users/${userId}/followers/count`,
  ).then((res) => (isRobloxError(res) ? res : (res as { count: number }).count));
}

export async function getFollowingCount(userId: number) {
  return rbFetch<{ count: number }>(
    `https://friends.roblox.com/v1/users/${userId}/followings/count`,
  ).then((res) => (isRobloxError(res) ? res : (res as { count: number }).count));
}

export async function getFollowers(
  userId: number,
  cursor: string = "",
): Promise<
  | { data: RobloxFriend[]; nextCursor: string | null; previousCursor: string | null }
  | RobloxError
> {
  const url = new URL(
    `https://friends.roblox.com/v1/users/${userId}/followers`,
  );
  url.searchParams.set("limit", "100");
  url.searchParams.set("sortOrder", "Desc");
  if (cursor) url.searchParams.set("cursor", cursor);
  return rbFetch<{
    data: RobloxFriend[];
    nextCursor: string | null;
    previousCursor: string | null;
  }>(url.toString());
}

export async function getFollowing(
  userId: number,
  cursor: string = "",
): Promise<
  | { data: RobloxFriend[]; nextCursor: string | null; previousCursor: string | null }
  | RobloxError
> {
  const url = new URL(
    `https://friends.roblox.com/v1/users/${userId}/followings`,
  );
  url.searchParams.set("limit", "100");
  url.searchParams.set("sortOrder", "Desc");
  if (cursor) url.searchParams.set("cursor", cursor);
  return rbFetch<{
    data: RobloxFriend[];
    nextCursor: string | null;
    previousCursor: string | null;
  }>(url.toString());
}

export async function getGroups(userId: number) {
  return rbFetch<{ data: RobloxGroupRole[] }>(
    `https://groups.roblox.com/v2/users/${userId}/groups/roles`,
  ).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxGroupRole[] };
    return data.data ?? [];
  });
}

export async function getBadges(userId: number) {
  const url = new URL(`https://badges.roblox.com/v1/users/${userId}/badges`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("sortOrder", "Desc");
  return rbFetch<{ data: RobloxBadge[] }>(url.toString()).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxBadge[] };
    return data.data ?? [];
  });
}

export async function getGames(userId: number) {
  const url = new URL(`https://games.roblox.com/v2/users/${userId}/games`);
  url.searchParams.set("accessFilter", "2");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sortOrder", "Desc");
  return rbFetch<{ data: RobloxGame[] }>(url.toString()).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxGame[] };
    return data.data ?? [];
  });
}

export async function getInventory(userId: number) {
  const url = new URL(
    `https://inventory.roblox.com/v1/users/${userId}/items/collectibles`,
  );
  url.searchParams.set("assetType", "8");
  url.searchParams.set("limit", "100");
  url.searchParams.set("sortOrder", "Desc");
  return rbFetch<{ data: RobloxCollectible[] }>(url.toString()).then((res) => {
    if (isRobloxError(res)) return res;
    const data = res as { data: RobloxCollectible[] };
    return data.data ?? [];
  });
}

/* ------------------------------------------------------------------ */
/* Thumbnail batch helpers (icons for groups/badges/games)             */
/* ------------------------------------------------------------------ */

export async function getGroupIcons(
  groupIds: number[],
): Promise<Record<number, string>> {
  if (groupIds.length === 0) return {};
  const url = `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupIds.join(
    ",",
  )}&size=150x150&format=Png&isCircular=false`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(
    url,
  );
  if (isRobloxError(res)) return {};
  const out: Record<number, string> = {};
  for (const d of (res as { data: { targetId: number; imageUrl: string }[] }).data) {
    out[d.targetId] = d.imageUrl;
  }
  return out;
}

export async function getBadgeIcons(
  badgeIds: number[],
): Promise<Record<number, string>> {
  if (badgeIds.length === 0) return {};
  const url = `https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${badgeIds.join(
    ",",
  )}&size=150x150&format=Png&isCircular=false`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(
    url,
  );
  if (isRobloxError(res)) return {};
  const out: Record<number, string> = {};
  for (const d of (res as { data: { targetId: number; imageUrl: string }[] }).data) {
    out[d.targetId] = d.imageUrl;
  }
  return out;
}

export async function getGameIcons(
  universeIds: number[],
): Promise<Record<number, string>> {
  if (universeIds.length === 0) return {};
  const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(
    ",",
  )}&size=256x256&format=Png&isCircular=false`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(
    url,
  );
  if (isRobloxError(res)) return {};
  const out: Record<number, string> = {};
  for (const d of (res as { data: { targetId: number; imageUrl: string }[] }).data) {
    out[d.targetId] = d.imageUrl;
  }
  return out;
}

export async function getAvatarThumbnails(
  userIds: number[],
): Promise<Record<number, string>> {
  if (userIds.length === 0) return {};
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(
    ",",
  )}&size=150x150&format=Png&isCircular=true`;
  const res = await rbFetch<{ data: { targetId: number; imageUrl: string }[] }>(
    url,
  );
  if (isRobloxError(res)) return {};
  const out: Record<number, string> = {};
  for (const d of (res as { data: { targetId: number; imageUrl: string }[] }).data) {
    out[d.targetId] = d.imageUrl;
  }
  return out;
}
