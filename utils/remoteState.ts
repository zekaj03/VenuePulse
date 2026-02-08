const REMOTE_VENUE_KEY = 'club_remote_venue_id';

type StatePatch = Record<string, unknown>;

const normalizeVenueId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default';

export const isRemoteStateEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;

  const envFlag = (import.meta.env.VITE_REMOTE_STATE_ENABLED || '').trim().toLowerCase();
  if (envFlag === 'true' || envFlag === '1') return true;
  return false;
};

export const getRemoteVenueId = (): string => {
  if (typeof window === 'undefined') return 'default';

  const configured = (import.meta.env.VITE_VENUE_ID || '').trim();
  if (configured) return normalizeVenueId(configured);

  const stored = localStorage.getItem(REMOTE_VENUE_KEY);
  if (stored) return normalizeVenueId(stored);

  const derived = normalizeVenueId(window.location.hostname || 'default');
  localStorage.setItem(REMOTE_VENUE_KEY, derived);
  return derived;
};

const isStatePatch = (value: unknown): value is StatePatch =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const applyServerSnapshotToLocalStorage = (state: StatePatch): void => {
  Object.entries(state).forEach(([key, value]) => {
    if (key.startsWith('_')) return;
    if (typeof value === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  });
};

export const hydrateLocalStateFromServer = async (): Promise<boolean> => {
  if (!isRemoteStateEnabled()) return false;

  try {
    const venueId = getRemoteVenueId();
    const response = await fetch(`/api/state?venueId=${encodeURIComponent(venueId)}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const payload = (await response.json()) as { state?: unknown };
    if (!isStatePatch(payload.state)) return false;

    applyServerSnapshotToLocalStorage(payload.state);
    localStorage.setItem('club_last_remote_sync', new Date().toISOString());
    return true;
  } catch (error) {
    console.warn('Remote hydration skipped:', error);
    return false;
  }
};

export const pushStatePatchToServer = async (patch: StatePatch): Promise<void> => {
  if (!isRemoteStateEnabled()) return;
  if (!Object.keys(patch).length) return;

  try {
    const venueId = getRemoteVenueId();
    const response = await fetch('/api/state', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId,
        patch,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`Remote sync failed with status ${response.status}`);
      return;
    }

    localStorage.setItem('club_last_remote_sync', new Date().toISOString());
  } catch (error) {
    console.warn('Remote sync skipped:', error);
  }
};
