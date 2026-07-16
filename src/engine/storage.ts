/**
 * Safe localStorage wrapper. Over file:// most browsers allow localStorage,
 * but Safari lockdown/private modes can throw — fall back to memory so the
 * game always works (progress just won't survive a reload).
 */
const memory = new Map<string, string>();
let storageWorks: boolean | null = null;

export function storageAvailable(): boolean {
  if (storageWorks !== null) return storageWorks;
  try {
    const probe = '__we_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
  return storageWorks;
}

export function loadItem(key: string): string | null {
  if (storageAvailable()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      /* fall through */
    }
  }
  return memory.get(key) ?? null;
}

export function saveItem(key: string, value: string): void {
  if (storageAvailable()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      /* fall through */
    }
  }
  memory.set(key, value);
}
