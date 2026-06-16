// Thin bridge to Tauri APIs. No-ops on web/mobile.
//
// We avoid a static dependency on @tauri-apps/api so the web build
// never pulls Tauri into its bundle. Tauri injects a window-global at
// runtime; we feature-detect and call it.

type TauriEventApi = {
  listen: (name: string, cb: (e: { payload: unknown }) => void) => Promise<() => void>;
};

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: { event?: TauriEventApi };
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
}

export async function onTauriEvent(
  name: string,
  fn: (payload: unknown) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {};
  const api = window.__TAURI__?.event;
  if (!api) return () => {};
  try {
    return await api.listen(name, (e) => fn(e.payload));
  } catch {
    return () => {};
  }
}
