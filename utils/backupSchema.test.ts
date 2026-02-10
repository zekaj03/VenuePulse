import { describe, it, expect } from 'vitest';
import { parseBackupFile } from './backupSchema';

describe('backupSchema', () => {
  it('parses a minimal backup file', () => {
    const result = parseBackupFile({ version: '1.0', data: {} });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.version).toBe('1.0');
  });

  it('reconstitutes log timestamps into Date', () => {
    const result = parseBackupFile({
      version: '1.0',
      data: {
        log: [
          {
            action: 'in',
            gender: 'Male',
            timestamp: '2026-02-10T08:00:00.000Z',
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const entry = result.value.data.log?.[0];
    expect(entry).toBeTruthy();
    expect(entry?.timestamp).toBeInstanceOf(Date);
  });

  it('rejects invalid timestamps', () => {
    const result = parseBackupFile({
      version: '1.0',
      data: {
        log: [{ action: 'in', gender: 'Male', timestamp: 'not-a-date' }],
      },
    });

    expect(result.ok).toBe(false);
  });
});
