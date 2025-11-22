// apps/web/lib/saves.ts
// Central place to store & read saved posts (localStorage-based)

export const SAVE_EVENT = "whistle:posts-mutated"; // profile listens for this
const KEY_PREFIXES = ["whistle:save:", "whistle:saved:", "whistle-save-"];
const TRUE = new Set(["1", "true", "yes", "y", "on", "t"]);

function getKey(id: string) {
  // use the canonical one for writing, but read all variants
  return `whistle:save:${id}`;
}

function readTruth(val: any) {
  return TRUE.has(String(val ?? "").toLowerCase().trim());
}

export function isSaved(id: string): boolean {
  if (typeof window === "undefined") return false;
  const keys = KEY_PREFIXES.map((p) => `${p}${id}`);
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (readTruth(v)) return true;
  }
  return false;
}

/** Set saved state and broadcast to all listeners (Profile listens) */
export function setSaved(id: string, saved: boolean) {
  if (typeof window === "undefined") return;
  const canonical = getKey(id);
  localStorage.setItem(canonical, saved ? "1" : "0");
  // also turn off other legacy variants so state stays consistent
  KEY_PREFIXES.forEach((p) => {
    const k = `${p}${id}`;
    if (k !== canonical && !saved) localStorage.setItem(k, "0");
  });
  // notify same-tab listeners
  window.dispatchEvent(new Event(SAVE_EVENT));
  // and cross-tab listeners (storage event only fires on *other* tabs)
  try { localStorage.setItem(SAVE_EVENT, String(Date.now())); } catch {}
}

export function toggleSaved(id: string): boolean {
  const next = !isSaved(id);
  setSaved(id, next);
  return next;
}

/** Read all saved IDs from localStorage (Profile uses this) */
export function getAllSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    const m = /^(?:whistle(?::|-))?(?:save|saved)(?::|-)(.+)$/i.exec(k);
    if (!m) continue;
    if (readTruth(localStorage.getItem(k))) ids.push(m[1]);
  }
  return Array.from(new Set(ids));
}
