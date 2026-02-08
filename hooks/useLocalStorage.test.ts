import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { persistState } from './useLocalStorage';

describe('persistState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes to localStorage after debounce delay', () => {
    persistState('test_key', { hello: 'world' });

    // Not written yet
    expect(localStorage.getItem('test_key')).toBeNull();

    // Advance past debounce delay
    vi.advanceTimersByTime(600);

    expect(localStorage.getItem('test_key')).toBe(JSON.stringify({ hello: 'world' }));
  });

  it('batches multiple writes within debounce window', () => {
    persistState('key_a', 'value_a');
    persistState('key_b', 'value_b');

    vi.advanceTimersByTime(600);

    expect(localStorage.getItem('key_a')).toBe(JSON.stringify('value_a'));
    expect(localStorage.getItem('key_b')).toBe(JSON.stringify('value_b'));
  });

  it('only writes the latest value when key is written multiple times', () => {
    persistState('key', 'first');
    persistState('key', 'second');
    persistState('key', 'third');

    vi.advanceTimersByTime(600);

    expect(localStorage.getItem('key')).toBe(JSON.stringify('third'));
  });

  it('handles quota exceeded errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock QuotaExceededError
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      const error = new DOMException('quota exceeded', 'QuotaExceededError');
      throw error;
    });

    persistState('big_key', 'big_value');
    vi.advanceTimersByTime(600);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage quota exceeded')
    );

    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
