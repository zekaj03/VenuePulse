
export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  action: 'in' | 'out';
  gender: Gender;
  note?: string;
}

export interface CapacityThreshold {
  percentage: number;
  enabled: boolean;
  notified?: boolean;
}

export interface UndoAction {
  type: 'counter';
  gender: Gender;
  action: 'in' | 'out';
  timestamp: Date;
  logEntryId: number;
}

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: Date | null;
  isActive: boolean;
}
