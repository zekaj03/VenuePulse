
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

// Multi-Zone Management
export interface Zone {
  id: string;
  name: string;
  maxCapacity: number;
  currentCount: number;
  color: string;
  icon?: string;
  isVIP: boolean;
  enabled: boolean;
}

export interface ZoneCount {
  male: number;
  female: number;
  other: number;
}

// Team Management
export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  zoneId?: string;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
}

// Guest Management
export interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  gender: Gender;
  zoneId?: string;
  isVIP: boolean;
  qrCode?: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  reservationTime: Date;
  partySize: number;
  zoneId?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
}

export interface WaitlistEntry {
  id: string;
  guestName: string;
  guestPhone?: string;
  partySize: number;
  addedAt: Date;
  estimatedWaitMinutes?: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
}

// Analytics
export interface PeakHour {
  hour: number;
  averageGuests: number;
  maxGuests: number;
}

export interface DailyReport {
  date: Date;
  totalGuestsIn: number;
  totalGuestsOut: number;
  peakCapacity: number;
  peakTime: Date | null;
  averageStayDuration: number; // minutes
  revenue?: number;
  zones?: { [zoneId: string]: ZoneReport };
}

export interface ZoneReport {
  totalGuests: number;
  peakCapacity: number;
  averageStayDuration: number;
}

export interface StayDuration {
  guestId: string;
  checkInTime: Date;
  checkOutTime: Date;
  durationMinutes: number;
  zoneId?: string;
}

// Financial
export interface RevenueEntry {
  id: string;
  timestamp: Date;
  amount: number;
  guestCount: number;
  averagePerGuest: number;
  zoneId?: string;
  notes?: string;
}

export interface DailyClosing {
  id: string;
  date: Date;
  totalRevenue: number;
  totalGuests: number;
  averageRevenuePerGuest: number;
  closedBy: string;
  closedAt: Date;
  notes?: string;
}

// Notifications
export interface NotificationSettings {
  browserPush: boolean;
  emailAlerts: boolean;
  webhookUrl?: string;
  capacityAlerts: boolean;
  dailyReports: boolean;
  shiftReminders: boolean;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Security
export interface SecuritySettings {
  pinEnabled: boolean;
  pin?: string;
  sessionTimeout: number; // minutes
  requirePinForSettings: boolean;
  requirePinForReports: boolean;
}

// Settings Extensions
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  soundEnabled: boolean;
  voiceFeedback: boolean;
  tabletMode: boolean;
  fullscreenMode: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  dataRetentionDays: number | null;
}
