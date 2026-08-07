import { clearDietary } from "./dietary";
import { resetDna } from "./dna";
import { clearFavoritesLocal } from "./favorites-sync";
import { clearHistoryLocal } from "./history";
import { clearSession } from "./session";

/**
 * Drop every piece of per-person state this browser holds.
 *
 * Taste DNA, favorites, history, and dietary prefs live in localStorage and
 * are not scoped by user id, so they outlive a Supabase sign-out. Left in
 * place they stay readable on a shared device and, worse, the next account
 * to sign in seeds its empty cloud row from them. Call this on every
 * sign-out and account-delete path.
 */
export function clearLocalUserData(): void {
  if (typeof window === "undefined") return;
  resetDna();
  clearFavoritesLocal();
  clearHistoryLocal();
  clearDietary();
  clearSession();
}
