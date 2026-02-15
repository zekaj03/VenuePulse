import { z } from 'zod';
import { Gender } from '../types';

/**
 * Backup schema for VenuePulse.
 *
 * Notes:
 * - Backups are produced via JSON export, so Date values in the log are stored as ISO strings.
 * - This schema validates and transforms the log timestamps back into Date instances.
 */

const genderEnum = z.nativeEnum(Gender);

const isoDateStringToDate = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date' });
      return z.NEVER;
    }
    return d;
  });

const themeSchema = z.union([z.literal('light'), z.literal('dark'), z.literal('system')]);
const languageSchema = z.union([z.literal('en'), z.literal('de'), z.literal('fr'), z.literal('es')]);

const countsSchema = z
  .object({
    [Gender.Male]: z.number().int().nonnegative(),
    [Gender.Female]: z.number().int().nonnegative(),
    [Gender.Other]: z.number().int().nonnegative(),
  })
  .strict();

const logEntrySchema = z
  .object({
    id: z.string().optional(),
    action: z.union([z.literal('in'), z.literal('out')]),
    gender: genderEnum,
    timestamp: z.union([isoDateStringToDate, z.date()]),
    note: z.string().optional(),
  })
  .passthrough();

// Settings are large and evolve; we validate only that it's an object.
// (We keep stricter validation for the most security-sensitive / safety-critical fields above.)
const settingsSchema = z.record(z.string(), z.unknown());

export const backupDataSchema = z
  .object({
    counts: countsSchema.optional(),
    log: z.array(logEntrySchema).optional(),
    settings: settingsSchema.optional(),
    maxCapacity: z.number().positive().optional(),
    theme: themeSchema.optional(),
    language: languageSchema.optional(),
  })
  .passthrough();

export type BackupData = z.infer<typeof backupDataSchema>;

export const backupFileSchema = z
  .object({
    version: z.string().min(1),
    timestamp: z.string().optional(),
    data: backupDataSchema,
  })
  .passthrough();

export type BackupFile = z.infer<typeof backupFileSchema>;

export const parseBackupFile = (value: unknown): { ok: true; value: BackupFile } | { ok: false; error: string } => {
  const result = backupFileSchema.safeParse(value);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? 'Invalid backup file' };
  }
  return { ok: true, value: result.data };
};
