"use client";

/**
 * Local media store (browser IndexedDB). On a static/local-first build there is
 * no server bucket, so uploaded images / PDFs / audio are stored as blobs in
 * IndexedDB and referenced from a node's `src` as `idb:<key>`. This keeps large
 * files out of localStorage (which holds the rest of the workspace) while still
 * persisting across reloads. http(s)/data URLs are passed through unchanged.
 */

import { useEffect, useState } from "react";

const DB_NAME = "notes-canvas-media";
const STORE = "blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMedia(blob: Blob): Promise<string> {
  const key = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return `idb:${key}`;
}

async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

const urlCache = new Map<string, string>();

export async function resolveMedia(ref: string): Promise<string | null> {
  if (!ref) return null;
  if (!ref.startsWith("idb:")) return ref; // http(s) / data URL
  if (urlCache.has(ref)) return urlCache.get(ref)!;
  try {
    const blob = await getBlob(ref.slice(4));
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(ref, url);
    return url;
  } catch {
    return null;
  }
}

export function isLocalMedia(ref?: string): boolean {
  return !!ref && ref.startsWith("idb:");
}

/**
 * Downscale + recompress an image so uploads are fast and small (big phone
 * photos can be many MB). Non-images and failures pass through unchanged.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<Blob> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", quality)
    );
    // Only use the compressed version if it actually helped.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Resolve a node `src` (idb: / http / data) to a displayable URL. */
export function useMediaURL(src?: string): string | null {
  const [url, setUrl] = useState<string | null>(
    src && !src.startsWith("idb:") ? src : null
  );
  useEffect(() => {
    let live = true;
    if (!src) {
      setUrl(null);
      return;
    }
    if (!src.startsWith("idb:")) {
      setUrl(src);
      return;
    }
    resolveMedia(src).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [src]);
  return url;
}
