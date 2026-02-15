/**
 * VenuePulse Configuration
 * 
 * All hardcoded configuration values should be defined here.
 * Values can be overridden via environment variables (VITE_*).
 */

export interface AppConfig {
  // Capacity settings
  defaultMaxCapacity: number;
  capacityThresholds: number[];
  auditLogMaxEntries: number;
  
  // Session settings
  defaultSessionTimeoutMinutes: number;
  
  // Free tier limits
  freeTierLogLimit: number;
  
  // UI settings
  defaultTheme: 'light' | 'dark' | 'system';
  defaultLanguage: string;
  
  // RevenueCat settings
  revenueCatEntitlementId: string;
  
  // API settings
  apiKeyPrefix: string;
}

/**
 * Load configuration from environment variables with validation
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    // Capacity settings
    defaultMaxCapacity: parseInt(import.meta.env.VITE_DEFAULT_MAX_CAPACITY || '200', 10),
    capacityThresholds: (import.meta.env.VITE_CAPACITY_THRESHOLDS || '50,75,90')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n > 0 && n <= 100),
    auditLogMaxEntries: parseInt(import.meta.env.VITE_AUDIT_LOG_MAX_ENTRIES || '1000', 10),
    
    // Session settings
    defaultSessionTimeoutMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '30', 10),
    
    // Free tier limits
    freeTierLogLimit: parseInt(import.meta.env.VITE_FREE_TIER_LOG_LIMIT || '50', 10),
    
    // UI settings
    defaultTheme: (import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'system') || 'system',
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
    
    // RevenueCat settings
    revenueCatEntitlementId: import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'premium',
    
    // API settings
    apiKeyPrefix: import.meta.env.VITE_API_KEY_PREFIX || 'vp_',
  };

  // Validate required configuration
  const errors: string[] = [];
  
  if (config.defaultMaxCapacity <= 0 || config.defaultMaxCapacity > 100000) {
    errors.push('VITE_DEFAULT_MAX_CAPACITY must be between 1 and 100000');
  }
  
  if (config.capacityThresholds.length === 0) {
    errors.push('VITE_CAPACITY_THRESHOLDS must contain at least one value');
  }
  
  if (config.defaultSessionTimeoutMinutes < 1 || config.defaultSessionTimeoutMinutes > 1440) {
    errors.push('VITE_SESSION_TIMEOUT_MINUTES must be between 1 and 1440');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return config;
}

// Singleton config instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
