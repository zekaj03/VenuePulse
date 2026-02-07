import { useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 500;

interface PersistEntry {
  key: string;
  value: unknown;
}

const pendingWrites = new Map<string, unknown>();
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function flushWrites() {
  pendingWrites.forEach((value, key) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn(`localStorage quota exceeded when writing key "${key}"`);
      } else {
        console.error(`Failed to persist key "${key}":`, error);
      }
    }
  });
  pendingWrites.clear();
}

export function persistState(key: string, value: unknown): void {
  pendingWrites.set(key, value);

  if (writeTimer) {
    clearTimeout(writeTimer);
  }
  writeTimer = setTimeout(flushWrites, DEBOUNCE_MS);
}

export function usePersistEffect(entries: PersistEntry[]): void {
  const prevRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    for (const { key, value } of entries) {
      const serialized = JSON.stringify(value);
      if (prevRef.current.get(key) !== serialized) {
        prevRef.current.set(key, serialized);
        persistState(key, value);
      }
    }
  });
}
