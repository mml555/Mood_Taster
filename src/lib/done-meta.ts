/** Ephemeral handoff from result feedback → completion screen. */

export type DoneMeta = {
  foodId: string;
  levelLabel?: string;
  deltasLine?: string;
};

const KEY = "mood-taster-done";

export function writeDoneMeta(meta: DoneMeta): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    /* private mode */
  }
}

export function readDoneMeta(foodId: string): DoneMeta | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DoneMeta;
    if (parsed.foodId !== foodId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDoneMeta(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
