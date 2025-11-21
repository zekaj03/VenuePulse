import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Gender, LogEntry } from './types';
import { languages, translations } from './locales';
import AnalyticsDashboard from './AnalyticsDashboard';

// ========= TYPEN & VALIDIERUNGEN ========= //

type Theme = 'light' | 'dark' | 'system';
type Language = keyof typeof languages;
type ToneSettings = { master: boolean; ui: boolean; guestIn: boolean; guestOut: boolean; alert: boolean; };
type CustomizationSettings = { accentColor: string; showOther: boolean; };
type AppSettings = { tones: ToneSettings; customization: CustomizationSettings; };

// Validatoren für das sichere Laden aus dem localStorage
const isLogEntryArray = (value: any): value is LogEntry[] => 
  Array.isArray(value) && 
  value.every(item => 
    item &&
    typeof item.id === 'number' && 
    typeof item.action === 'string' && (item.action === 'in' || item.action === 'out') &&
    typeof item.gender === 'string' && Object.values(Gender).includes(item.gender as Gender) &&
    item.timestamp instanceof Date && !isNaN(item.timestamp.getTime())
  );
const isTheme = (value: any): value is Theme => ['light', 'dark', 'system'].includes(value);
const isLanguage = (value: any): value is Language => Object.keys(languages).includes(value);
const isToneSettings = (value: any): value is ToneSettings => value && typeof value.master === 'boolean' && typeof value.ui === 'boolean' && typeof value.guestIn === 'boolean' && typeof value.guestOut === 'boolean' && typeof value.alert === 'boolean';
const isCustomizationSettings = (value: any): value is CustomizationSettings => value && typeof value.accentColor === 'string' && typeof value.showOther === 'boolean';


// ========= HELPER-FUNKTIONEN ========= //

const useFocusTrap = (ref: React.RefObject<HTMLElement>, isOpen: boolean) => {
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen || !ref.current) return;

        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        const focusableElements = Array.from(
            ref.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select'
            )
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        (firstElement as HTMLElement).focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (focusableElements.length === 1) {
                e.preventDefault();
                return;
            }

            if (e.shiftKey) { 
                if (document.activeElement === firstElement) {
                    (lastElement as HTMLElement).focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    (firstElement as HTMLElement).focus();
                    e.preventDefault();
                }
            }
        };

        const currentRef = ref.current;
        currentRef.addEventListener('keydown', handleKeyDown);

        return () => {
            currentRef.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElement.current?.focus();
        };
    }, [isOpen, ref]);
};

const loadValidatedState = <T,>(key: string, defaultValue: T, validator: (value: any) => value is T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;
    const parsedValue = JSON.parse(storedValue);
    if (key === 'club_log' && Array.isArray(parsedValue)) {
        parsedValue.forEach(entry => entry.timestamp = new Date(entry.timestamp));
    }
    return validator(parsedValue) ? parsedValue : defaultValue;
  } catch (error) {
    console.error(`Fehler beim Laden des Status für Schlüssel "${key}":`, error);
    return defaultValue;
  }
};

const playSound = (soundRef: React.MutableRefObject<HTMLAudioElement | null>, settings: ToneSettings, type: keyof Omit<ToneSettings, 'master'>) => {
    if (settings.master && settings[type] && soundRef.current) {
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(error => console.error("Sound konnte nicht abgespielt werden:", error));
    }
};

const exportToCsv = (data: DailySummary[], header: string[], filename: string) => {
    const rows = data.map(row => [row.date, row.peakGuests, row.totalEntries, row.totalGuests, row.guestsAtEndOfDay].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [header.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// ========= UI-KOMPONENTEN ========= //

interface CounterCardProps {
  title: string;
  count: number;
  onIn: () => void;
  onOut: () => void;
  colorClass: string;
  inDisabled: boolean;
  t: (key: keyof typeof translations.en, replacements?: {[key: string]: string}) => string;
  gradientFrom: string;
  gradientTo: string;
}

const CounterCard: React.FC<CounterCardProps> = ({ title, count, onIn, onOut, colorClass, inDisabled, t, gradientFrom, gradientTo }) => (
  <div className="group relative glass-panel rounded-[2.5rem] p-6 text-center shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col overflow-hidden border-white/60 dark:border-white/10">
    {/* Ambient Background Glow */}
    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 dark:opacity-20 blur-3xl ${gradientFrom}`}></div>
    
    <div className="relative z-10 flex-grow flex flex-col justify-center mb-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{title}</h2>
      <div className={`text-6xl font-light tracking-tight ${colorClass} drop-shadow-sm`}>
          {count}
      </div>
    </div>

    <div className="relative z-10 flex justify-center space-x-3 mt-auto">
      <button 
        onClick={onIn} 
        disabled={inDisabled}
        className="flex-1 bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all duration-300 active:scale-95 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none backdrop-blur-md"
        aria-label={t('guestInLabel', {title})}
      >
        <span className="drop-shadow-md">{t('buttonIn')}</span>
      </button>
      <button 
        onClick={onOut} 
        className="flex-1 bg-gradient-to-b from-rose-400 to-rose-500 hover:from-rose-300 hover:to-rose-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-rose-500/20 transition-all duration-300 active:scale-95 hover:shadow-rose-500/30 backdrop-blur-md"
        aria-label={t('guestOutLabel', {title})}
      >
        <span className="drop-shadow-md">{t('buttonOut')}</span>
      </button>
    </div>
  </div>
);

interface CapacityBarProps {
  currentCount: number;
  maxCapacity: number;
  t: (key: keyof typeof translations.en) => string;
}

const CapacityBar: React.FC<CapacityBarProps> = ({ currentCount, maxCapacity, t }) => {
  const percentage = maxCapacity > 0 ? (currentCount / maxCapacity) * 100 : 0;
  
  let gradientClass = 'from-emerald-400 to-teal-500';
  let shadowColor = 'shadow-emerald-500/30';
  
  if (percentage > 85) {
    gradientClass = 'from-rose-500 to-red-600';
    shadowColor = 'shadow-rose-500/30';
  } else if (percentage > 60) {
    gradientClass = 'from-amber-400 to-orange-500';
    shadowColor = 'shadow-amber-500/30';
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-end mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('capacity')}</span>
        <div className="text-right">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{currentCount}</span>
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium mx-1">/</span>
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">{maxCapacity}</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-black/20 rounded-full h-6 shadow-inner backdrop-blur-sm overflow-hidden border border-white/30 dark:border-white/5">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${gradientClass} shadow-lg ${shadowColor} relative`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={currentCount}
          aria-valuemin={0}
          aria-valuemax={maxCapacity}
        >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      <p className="text-right text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2">{percentage.toFixed(1)}% {t('occupied')}</p>
    </div>
  );
};

// ========= GENDER DISTRIBUTION CHART ========= //
const genderChartColors = {
    [Gender.Male]: '#60a5fa', // blue-400
    [Gender.Female]: '#f472b6', // pink-400
    [Gender.Other]: '#a78bfa', // purple-400
};

interface GenderDistributionChartProps {
  counts: { [key in Gender]: number };
  totalGuests: number;
  showOther: boolean;
  t: (key: keyof typeof translations.en) => string;
}

const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({ counts, totalGuests, showOther, t }) => {
  const size = 220;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const data = useMemo(() => {
    const genders: Gender[] = [Gender.Male, Gender.Female];
    if (showOther) {
      genders.push(Gender.Other);
    }
    const filteredData = genders
      .map(gender => ({
        gender,
        value: counts[gender],
        percentage: totalGuests > 0 ? (counts[gender] / totalGuests) * 100 : 0,
        color: genderChartColors[gender],
      }))
      .filter(item => item.value > 0);
    
    let accumulatedPercentage = 0;
    return filteredData.map(item => {
        const itemWithOffset = { ...item, offset: accumulatedPercentage };
        accumulatedPercentage += item.percentage;
        return itemWithOffset;
    });

  }, [counts, totalGuests, showOther]);

  return (
    <div className="flex flex-col items-center justify-center py-4 relative">
      <div className="relative flex items-center justify-center">
        {/* Glow Effect behind chart */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full transform scale-75"></div>
        
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 transform drop-shadow-lg" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800/50 transition-all duration-300"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {data.map(item => {
            const offset = (item.offset / 100) * circumference;
            const dasharray = (item.percentage / 100) * circumference;
            return (
              <circle
                key={item.gender}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dasharray} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
           <p className="text-7xl font-light text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">{totalGuests}</p>
           <p className="text-slate-400 dark:text-slate-400 font-medium text-xs uppercase tracking-[0.2em] mt-1">{t('totalGuestsTitle')}</p>
        </div>
      </div>

       <div className="flex justify-center items-center space-x-6 mt-8">
          <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)] mb-1"></div>
              <p className="text-xs text-slate-500 font-medium">{t('genderMale')}</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{(totalGuests > 0 ? (counts[Gender.Male] / totalGuests) * 100 : 0).toFixed(0)}%</p>
          </div>
          <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.6)] mb-1"></div>
              <p className="text-xs text-slate-500 font-medium">{t('genderFemale')}</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{(totalGuests > 0 ? (counts[Gender.Female] / totalGuests) * 100 : 0).toFixed(0)}%</p>
          </div>
          {showOther && (
             <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.6)] mb-1"></div>
                <p className="text-xs text-slate-500 font-medium">{t('genderOther')}</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{(totalGuests > 0 ? (counts[Gender.Other] / totalGuests) * 100 : 0).toFixed(0)}%</p>
             </div>
          )}
        </div>
    </div>
  );
};


interface DailySummary {
  date: string;
  peakGuests: number;
  totalEntries: number;
  totalGuests: number;
  guestsAtEndOfDay: number;
}

const calculateDailyHistory = (log: LogEntry[], locale: string): DailySummary[] => {
  if (!log.length) return [];

  const sortedLog = [...log].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const entriesByDay: { [key: string]: LogEntry[] } = {};
  sortedLog.forEach(entry => {
    const dateKey = new Date(entry.timestamp.getFullYear(), entry.timestamp.getMonth(), entry.timestamp.getDate()).toISOString();
    if (!entriesByDay[dateKey]) {
      entriesByDay[dateKey] = [];
    }
    entriesByDay[dateKey].push(entry);
  });

  const dailySummaries: DailySummary[] = [];
  let guestsAtStartOfDay = 0;

  const sortedDates = Object.keys(entriesByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  for (const dateKey of sortedDates) {
    const dayEntries = entriesByDay[dateKey];
    
    let currentGuests = guestsAtStartOfDay;
    let peakGuests = guestsAtStartOfDay;
    let totalEntries = 0;

    dayEntries.forEach(entry => {
      if (entry.action === 'in') {
        currentGuests++;
        totalEntries++;
      } else {
        currentGuests--;
      }
      if (currentGuests > peakGuests) {
        peakGuests = currentGuests;
      }
    });

    const totalGuests = guestsAtStartOfDay + totalEntries;

    dailySummaries.push({
      date: new Date(dateKey).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      peakGuests,
      totalEntries,
      totalGuests,
      guestsAtEndOfDay: currentGuests
    });
    
    guestsAtStartOfDay = currentGuests;
  }
  
  return dailySummaries.reverse();
};

const defaultLogoSvg = `<svg width="40" height="40" viewBox="0 0 52 48" fill="url(#logo-gradient)" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="logo-gradient" x1="0" y1="0" x2="100%" y2="100%">
<stop offset="0%" stop-color="#22d3ee" />
<stop offset="100%" stop-color="#6366f1" />
</linearGradient>
</defs>
<rect x="2" y="14" width="4" height="20" rx="2"/><rect x="8" y="22" width="4" height="12" rx="2"/><rect x="14" y="30" width="4" height="4" rx="2"/><rect x="20" y="22" width="4" height="12" rx="2"/><rect x="26" y="14" width="4" height="20" rx="2"/><rect x="34" y="14" width="4" height="20" rx="2"/><rect x="40" y="14" width="4" height="6" rx="2"/><rect x="46" y="14" width="4" height="6" rx="2"/><rect x="40" y="24" width="4" height="6" rx="2"/><rect x="46" y="24" width="4" height="6" rx="2"/></svg>`;
const colorPalettes: { [key: string]: { [key: number]: string } } = {
    cyan: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490' },
    pink: { 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d' },
    blue: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    green: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
    purple: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
};


// ========= HAUPTKOMPONENTE: App ========= //

const App: React.FC = () => {
    // ========= STATE-MANAGEMENT ========= //
    
    const [counts, setCounts] = useState(() => loadValidatedState('club_counts', { [Gender.Male]: 0, [Gender.Female]: 0, [Gender.Other]: 0 }, (v: any): v is {[key in Gender]: number} => v && typeof v.Male === 'number' && typeof v.Female === 'number' && typeof v.Other === 'number'));
    const [log, setLog] = useState<LogEntry[]>(() => loadValidatedState('club_log', [], isLogEntryArray));
    const [maxCapacity, setMaxCapacity] = useState(() => loadValidatedState<number>('club_max_capacity', 200, (v: any): v is number => typeof v === 'number' && v > 0));

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [showCapacityAlert, setShowCapacityAlert] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>(() => loadValidatedState('club_settings', {
        tones: { master: true, ui: true, guestIn: true, guestOut: true, alert: true },
        customization: { accentColor: 'cyan', showOther: true },
    }, (v: any): v is AppSettings => v && isToneSettings(v.tones) && isCustomizationSettings(v.customization)));
    const [theme, setTheme] = useState<Theme>(() => loadValidatedState('club_theme', 'system', isTheme));
    const [language, setLanguage] = useState<Language>(() => {
      const savedLang = loadValidatedState('club_language', navigator.language.split('-')[0], isLanguage);
      return isLanguage(savedLang) ? savedLang : 'en';
    });


    const [tutorialStep, setTutorialStep] = useState<number>(() => loadValidatedState<boolean>('club_tutorial_complete', false, (v: any): v is boolean => typeof v === 'boolean') ? -1 : 0);

    const settingsModalRef = useRef<HTMLDivElement>(null);
    const historyModalRef = useRef<HTMLDivElement>(null);

    const capacityReachedSound = useRef<HTMLAudioElement | null>(null);
    const uiClickSound = useRef<HTMLAudioElement | null>(null);
    const guestInSound = useRef<HTMLAudioElement | null>(null);
    const guestOutSound = useRef<HTMLAudioElement | null>(null);

    // Initialize audio objects lazily
    useEffect(() => {
        capacityReachedSound.current = new Audio("data:audio/wav;base64,UklGRmIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSoAAAD/fwA/fwC/fwA/fwA/fwC/fwC/fwA/fwC/fwC/fwA/fwA/fwC/fwC/fwA/fwA/fwC/fwA/fwC/fwC/fwA/fwA/fwC/fwA/fwA/fwA/fwA/fwC/fwA/fwA/fwC/fwA/fwA/fwA=");
        uiClickSound.current = new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSQAAAAA/v8f/f8O/0oAUP89/1wAJf9A/2EAKf9S/2wAJf9W/z0AGv9G/zMAAf9S/xAAFP9u/zUAFv90/wcAEf9E/woA");
        guestInSound.current = new Audio("data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSYAAAAA/v8AAP8HAAMA/wMAAQALAAYACgADAAIA/v8EAAAA/v8B/wIA");
        guestOutSound.current = new Audio("data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSYAAAAAAAEA/v8D/wIAAgADAAIA/v8B/wAA/v8A/v8EAAIAAgADAAI=");
    }, []);

    // ========= INTERNATIONALISIERUNG (i18n) ========= //
    const t = useCallback((key: keyof typeof translations.en, replacements?: {[key: string]: string}) => {
        let text = (translations[language] as any)[key] || translations.en[key] || key;
        if (replacements) {
          Object.keys(replacements).forEach(rKey => {
            text = text.replace(`{${rKey}}`, replacements[rKey]);
          });
        }
        return text;
    }, [language]);
    
    const localeMap: { [key in Language]: string } = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
    const currentLocale = localeMap[language];

    const totalGuests = useMemo(() => Object.values(counts).reduce((sum: number, count: number) => sum + count, 0), [counts]);
    const capacityReached = useMemo(() => totalGuests >= maxCapacity, [totalGuests, maxCapacity]);
    const dailyHistory = useMemo(() => calculateDailyHistory(log, currentLocale), [log, currentLocale]);
    
    
    // ========= EFFEKTE (LADEN, SPEICHERN, THEME, EVENTS) ========= //
    
    useFocusTrap(settingsModalRef, isSettingsOpen);
    useFocusTrap(historyModalRef, isHistoryOpen);

    useEffect(() => {
        localStorage.setItem('club_counts', JSON.stringify(counts));
        localStorage.setItem('club_log', JSON.stringify(log));
        localStorage.setItem('club_max_capacity', JSON.stringify(maxCapacity));
        localStorage.setItem('club_theme', JSON.stringify(theme));
        localStorage.setItem('club_language', JSON.stringify(language));
        localStorage.setItem('club_settings', JSON.stringify(settings));
        localStorage.setItem('club_tutorial_complete', JSON.stringify(tutorialStep === -1));
    }, [counts, log, maxCapacity, theme, language, settings, tutorialStep]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        const body = document.body;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            body.classList.toggle('dark', e.matches);
        };

        if (theme === 'system') {
            body.classList.toggle('dark', mediaQuery.matches);
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else {
            body.classList.toggle('dark', theme === 'dark');
        }
        
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);


    useEffect(() => {
        if (capacityReached) {
            setShowCapacityAlert(true);
            playSound(capacityReachedSound, settings.tones, 'alert');
            const timer = setTimeout(() => setShowCapacityAlert(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [capacityReached, settings.tones]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSettingsOpen(false);
                setIsHistoryOpen(false);
                setIsAnalyticsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    
    // ========= HANDLER-FUNKTIONEN ========= //
    
    const handleLog = useCallback((gender: Gender, action: 'in' | 'out') => {
        setLog(prevLog => {
            const newEntry: LogEntry = { id: Date.now(), timestamp: new Date(), action, gender };
            return [newEntry, ...prevLog];
        });
    }, []);

    const handleIn = useCallback((gender: Gender) => {
        if (capacityReached) return;
        setCounts(prev => ({ ...prev, [gender]: prev[gender] + 1 }));
        handleLog(gender, 'in');
        playSound(guestInSound, settings.tones, 'guestIn');
    }, [handleLog, settings.tones, capacityReached]);

    const handleOut = useCallback((gender: Gender) => {
        setCounts(prev => {
            if (prev[gender] <= 0) return prev;
            handleLog(gender, 'out');
            playSound(guestOutSound, settings.tones, 'guestOut');
            return { ...prev, [gender]: prev[gender] - 1 };
        });
    }, [handleLog, settings.tones]);

    const handleResetAllData = () => {
        if (window.confirm(t('resetConfirmation'))) {
            setCounts({ [Gender.Male]: 0, [Gender.Female]: 0, [Gender.Other]: 0 });
            setLog([]);
            setMaxCapacity(200);
            setTheme('system');
            setLanguage('en');
            setSettings({
                tones: { master: true, ui: true, guestIn: true, guestOut: true, alert: true },
                customization: { accentColor: 'cyan', showOther: true },
            });
            localStorage.clear();
        }
    };

    const sortedLog = useMemo(() => [...log].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()), [log]);
    
    const tutorialSteps = useMemo(() => [
        { selector: '#total-guests-card', text: t('tutorialStep1') },
        { selector: '#capacity-bar', text: t('tutorialStep2') },
        { selector: '.counter-grid', text: t('tutorialStep3') },
        { selector: '#activity-log', text: t('tutorialStep4') },
        { selector: '#settings-button', text: t('tutorialStep5') },
    ], [t]);

    const counterCardGenderMap = useMemo(() => ({
        [Gender.Male]: t('genderMale'),
        [Gender.Female]: t('genderFemale'),
        [Gender.Other]: t('genderOther'),
    }), [t]);

    const logGenderMap = useMemo(() => ({
        [Gender.Male]: t('logMale'),
        [Gender.Female]: t('logFemale'),
        [Gender.Other]: t('logOther'),
    }), [t]);
    
    const currentTutorialStep = tutorialStep >= 0 && tutorialStep < tutorialSteps.length ? tutorialSteps[tutorialStep] : null;
    const tutorialTarget = currentTutorialStep ? document.querySelector(currentTutorialStep.selector) : null;
    const targetRect = tutorialTarget?.getBoundingClientRect();

    const csvHeaders = [t('historyTableDate'), t('historyTablePeak'), t('historyTableTotalEntries'), t('historyTableTotalGuests'), t('historyTableEnd')];

    // ========= RENDER-METHODE ========= //

    return (
        <>
            <style>{`
                :root {
                  --accent-400: ${colorPalettes[settings.customization.accentColor]?.[400]};
                  --accent-500: ${colorPalettes[settings.customization.accentColor]?.[500]};
                  --accent-600: ${colorPalettes[settings.customization.accentColor]?.[600]};
                  --accent-700: ${colorPalettes[settings.customization.accentColor]?.[700]};
                }
            `}</style>
            
            {/* Tutorial Overlay */}
            {currentTutorialStep && targetRect && (
                <div className="fixed inset-0 z-50">
                     <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setTutorialStep(-1)}></div>
                     <div className="absolute transition-all duration-500 bg-transparent border-4 border-white/30 rounded-xl box-content -m-4 shadow-[0_0_0_9999px_rgba(15,23,42,0.8)]" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }}></div>
                     <div className="absolute glass-panel p-6 rounded-2xl shadow-2xl text-slate-800 dark:text-white max-w-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                        style={{ top: targetRect.bottom + 24, left: Math.min(Math.max(16, targetRect.left + (targetRect.width / 2) - 150), window.innerWidth - 320) }}
                     >
                         <p className="mb-6 text-lg leading-relaxed">{currentTutorialStep.text}</p>
                         <div className="flex justify-between items-center">
                             <button onClick={() => setTutorialStep(-1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-3 py-2">{t('tutorialSkip')}</button>
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">{tutorialStep + 1} / {tutorialSteps.length}</span>
                                <button onClick={() => setTutorialStep(s => s + 1)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-2 px-6 rounded-full shadow-lg hover:scale-105 transition-transform">{t('tutorialNext')}</button>
                             </div>
                         </div>
                     </div>
                </div>
            )}
            
            <div className={`min-h-screen p-4 sm:p-6 lg:p-8 relative transition-all duration-500 ${isSettingsOpen || isHistoryOpen || isAnalyticsOpen ? 'blur-md scale-[0.98] opacity-50' : ''}`} aria-hidden={isSettingsOpen || isHistoryOpen || isAnalyticsOpen}>
                 <header className="flex justify-between items-center mb-10 max-w-7xl mx-auto px-2">
                     <div className="flex items-center space-x-4 group cursor-pointer">
                        <a href="/" aria-label="Reload" className="relative transition-transform group-hover:scale-110 duration-300">
                             <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full"></div>
                             <div className="relative w-12 h-12 text-slate-800 dark:text-white drop-shadow-lg" dangerouslySetInnerHTML={{ __html: defaultLogoSvg }}></div>
                        </a>
                         <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">{t('appTitle')}</h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('appSubtitle')}</p>
                        </div>
                     </div>
                    
                    <div className="flex items-center gap-4">
                         <button onClick={() => { setIsAnalyticsOpen(true); playSound(uiClickSound, settings.tones, 'ui'); }} className="w-12 h-12 flex items-center justify-center glass-panel rounded-full text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 shadow-lg border border-white/40 dark:border-white/10" aria-label={t('analyticsTitle')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                         </button>
                        <button id="settings-button" onClick={() => { setIsSettingsOpen(true); playSound(uiClickSound, settings.tones, 'ui'); }} className="w-12 h-12 flex items-center justify-center glass-panel rounded-full text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition-all duration-300 hover:scale-110 shadow-lg border border-white/40 dark:border-white/10" aria-label={t('settingsTitle')} aria-haspopup="true" aria-expanded={isSettingsOpen}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Main Stats */}
                    <div className="lg:col-span-8 space-y-8">
                        <div id="total-guests-card" className="glass-panel rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border-white/60 dark:border-white/10">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-pink-500 to-purple-500 opacity-50"></div>
                            <GenderDistributionChart 
                                counts={counts}
                                totalGuests={totalGuests}
                                showOther={settings.customization.showOther}
                                t={t}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 counter-grid">
                            <CounterCard 
                                title={counterCardGenderMap[Gender.Male]} 
                                count={counts[Gender.Male]} 
                                onIn={() => handleIn(Gender.Male)} 
                                onOut={() => handleOut(Gender.Male)} 
                                colorClass="text-blue-500 dark:text-blue-400" 
                                inDisabled={capacityReached} 
                                t={t}
                                gradientFrom="bg-blue-500"
                                gradientTo="bg-cyan-400"
                            />
                            <CounterCard 
                                title={counterCardGenderMap[Gender.Female]} 
                                count={counts[Gender.Female]} 
                                onIn={() => handleIn(Gender.Female)} 
                                onOut={() => handleOut(Gender.Female)} 
                                colorClass="text-pink-500 dark:text-pink-400" 
                                inDisabled={capacityReached} 
                                t={t}
                                gradientFrom="bg-pink-500"
                                gradientTo="bg-rose-400"
                            />
                            {settings.customization.showOther && (
                                <CounterCard 
                                    title={counterCardGenderMap[Gender.Other]} 
                                    count={counts[Gender.Other]} 
                                    onIn={() => handleIn(Gender.Other)} 
                                    onOut={() => handleOut(Gender.Other)} 
                                    colorClass="text-purple-500 dark:text-purple-400" 
                                    inDisabled={capacityReached} 
                                    t={t}
                                    gradientFrom="bg-purple-500"
                                    gradientTo="bg-indigo-400"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Column - Info & Log */}
                    <div className="lg:col-span-4 space-y-8">
                        <div id="capacity-bar" className="glass-panel rounded-[2rem] p-6 shadow-xl border-white/60 dark:border-white/10">
                          <CapacityBar currentCount={totalGuests} maxCapacity={maxCapacity} t={t} />
                        </div>
                        
                        <div id="activity-log" className="glass-panel rounded-[2rem] p-6 shadow-xl h-[500px] flex flex-col relative overflow-hidden border-white/60 dark:border-white/10">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                {t('activityLogTitle')}
                            </h3>
                            <div className="overflow-y-auto pr-2 flex-1 space-y-3 mask-image-linear-gradient-to-b scroll-smooth">
                                {sortedLog.length > 0 ? sortedLog.map(entry => (
                                    <div key={entry.id} className="flex justify-between items-center p-3 rounded-xl bg-white/60 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group border border-white/40 dark:border-transparent">
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 opacity-70 group-hover:opacity-100 transition-opacity">{new Date(entry.timestamp).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' })}</span>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-bold ${entry.gender === Gender.Male ? 'text-blue-600 dark:text-blue-300' : entry.gender === Gender.Female ? 'text-pink-600 dark:text-pink-300' : 'text-purple-600 dark:text-purple-300'}`}>
                                                {logGenderMap[entry.gender]}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${entry.action === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {entry.action === 'in' ? t('logIn') : t('logOut')}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                        <div className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center">
                                            <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm">{t('noActivity')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {showCapacityAlert && (
                    <div className="capacity-alert fixed top-8 left-1/2 transform -translate-x-1/2 glass-panel bg-rose-500/90 dark:bg-rose-600/90 border-rose-400 text-white font-bold px-8 py-4 rounded-full shadow-2xl z-[100] flex items-center gap-3 backdrop-blur-xl">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {t('capacityReachedAlert')}
                    </div>
                )}
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard 
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                log={log}
                counts={counts}
                maxCapacity={maxCapacity}
                showOther={settings.customization.showOther}
                t={t}
            />

            {/* Settings Modal */}
            {isSettingsOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                     <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setIsSettingsOpen(false)}></div>
                     <div ref={settingsModalRef} className="relative w-full max-w-2xl glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border-white/60 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-transparent">
                            <div className="flex justify-between items-center mb-8">
                                <h2 id="settings-title" className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('settingsTitle')}</h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label={t('close')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            
                            <div className="space-y-8">
                                {/* Language & Appearance */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('language')}</h3>
                                        <div className="bg-white/60 dark:bg-black/20 p-1 rounded-2xl flex p-1.5 border border-white/40 dark:border-white/5">
                                            {Object.entries(languages).map(([key, name]) => (
                                                <button 
                                                    key={key}
                                                    onClick={() => setLanguage(key as Language)}
                                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${language === key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                                                >
                                                    {key.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('themeLabel')}</h3>
                                        <div className="bg-white/60 dark:bg-black/20 p-1 rounded-2xl flex p-1.5 border border-white/40 dark:border-white/5">
                                            {(['light', 'dark', 'system'] as Theme[]).map(th => (
                                                <button key={th} onClick={() => setTheme(th)} className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize ${theme === th ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:bg-white/50 dark:text-slate-400'}`}>
                                                    {t(`theme${th.charAt(0).toUpperCase() + th.slice(1)}` as keyof typeof translations.en)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('sectionCapacity')}</h3>
                                    <div className="bg-white/60 dark:bg-black/20 p-6 rounded-3xl flex items-center justify-between border border-white/40 dark:border-white/5">
                                        <label htmlFor="max-capacity" className="font-medium text-slate-700 dark:text-slate-200">{t('maxCapacityLabel')}</label>
                                        <input id="max-capacity" type="number" value={maxCapacity} onChange={e => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))} className="bg-white dark:bg-slate-800/50 rounded-xl p-3 w-32 text-center font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner text-slate-800 dark:text-white"/>
                                    </div>
                                </div>

                                {/* Customization */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('sectionCustomization')}</h3>
                                    <div className="bg-white/60 dark:bg-black/20 p-6 rounded-3xl space-y-6 border border-white/40 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{t('accentColorLabel')}</span >
                                            <div className="flex gap-3">
                                                {Object.keys(colorPalettes).map(color => (
                                                    <button key={color} onClick={() => setSettings(s => ({...s, customization: {...s.customization, accentColor: color }}))} 
                                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${settings.customization.accentColor === color ? 'ring-4 ring-white dark:ring-slate-700 shadow-lg scale-110' : ''}`}
                                                    style={{ backgroundColor: colorPalettes[color][500] }}
                                                    aria-label={t('selectAccentColor', {color})}
                                                    ></button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-white/5">
                                             <label htmlFor="show-other" className="font-medium text-slate-700 dark:text-slate-200">{t('showOtherCategoryLabel')}</label>
                                             <button onClick={() => setSettings(s => ({...s, customization: {...s.customization, showOther: !s.customization.showOther}}))}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${settings.customization.showOther ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                role="switch" aria-checked={settings.customization.showOther} id="show-other"
                                             >
                                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${settings.customization.showOther ? 'translate-x-7' : 'translate-x-1'}`}/>
                                            </button>
                                         </div>
                                    </div>
                                </div>
                                
                                {/* Sounds */}
                                 <div className="space-y-4">
                                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('sectionSounds')}</h3>
                                     <div className="bg-white/60 dark:bg-black/20 p-6 rounded-3xl space-y-4 border border-white/40 dark:border-white/5">
                                          {Object.entries({ master: t('soundMaster'), ui: t('soundUIClicks'), guestIn: t('soundGuestIn'), guestOut: t('soundGuestOut'), alert: t('soundCapacityAlert') }).map(([key, label]) => (
                                             <div key={key} className="flex items-center justify-between">
                                                 <label htmlFor={`tone-${key}`} className={`font-medium text-slate-700 dark:text-slate-200 ${key !== 'master' && !settings.tones.master ? 'opacity-50' : ''}`}>{label}</label>
                                                 <button onClick={() => setSettings(s => ({...s, tones: {...s.tones, [key]: !s.tones[key as keyof ToneSettings]}}))}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.tones[key as keyof ToneSettings] ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    role="switch" aria-checked={settings.tones[key as keyof ToneSettings]} id={`tone-${key}`}
                                                 >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${settings.tones[key as keyof ToneSettings] ? 'translate-x-6' : 'translate-x-1'}`}/>
                                                </button>
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                {/* Actions */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('sectionAdvanced')}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button onClick={() => { setIsSettingsOpen(false); setIsHistoryOpen(true); }} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-700/60 font-semibold text-slate-800 dark:text-white transition-colors text-left flex items-center justify-between group border border-white/40 dark:border-transparent">
                                            {t('showHistoryButton')}
                                            <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                        <button onClick={() => exportToCsv(dailyHistory, csvHeaders, `venuepulse_history_${new Date().toISOString().split('T')[0]}.csv`)} disabled={!dailyHistory.length} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-700/60 font-semibold text-slate-800 dark:text-white transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed group border border-white/40 dark:border-transparent">
                                            {t('exportHistoryButton')}
                                            <svg className="w-5 h-5 text-slate-400 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                        <button onClick={() => setTutorialStep(0)} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-700/60 font-semibold text-slate-800 dark:text-white transition-colors text-left border border-white/40 dark:border-transparent">
                                            {t('restartTutorialButton')}
                                        </button>
                                        <button onClick={handleResetAllData} className="p-4 rounded-2xl bg-rose-100/50 dark:bg-rose-900/20 hover:bg-rose-200/50 dark:hover:bg-rose-900/40 font-semibold text-rose-700 dark:text-rose-400 transition-colors text-left border border-rose-200/50 dark:border-transparent">
                                            {t('resetAllDataButton')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                 </div>
            )}
            
            {/* History Modal */}
            {isHistoryOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                     <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setIsHistoryOpen(false)}></div>
                     <div ref={historyModalRef} className="relative w-full max-w-3xl glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300 border-white/60 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center bg-white/60 dark:bg-black/20">
                            <h2 id="history-title" className="text-2xl font-bold text-slate-800 dark:text-white">{t('historyTitle')}</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label={t('close')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-0 bg-white/30 dark:bg-transparent">
                             {dailyHistory.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="p-4 pl-8 font-semibold">{t('historyTableDate')}</th>
                                            <th className="p-4 text-center font-semibold">{t('historyTablePeak')}</th>
                                            <th className="p-4 text-center font-semibold">{t('historyTableTotalEntries')}</th>
                                            <th className="p-4 text-center font-semibold">{t('historyTableTotalGuests')}</th>
                                            <th className="p-4 pr-8 text-center font-semibold">{t('historyTableEnd')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                    {dailyHistory.map((day, idx) => (
                                        <tr key={day.date} className={`border-b border-slate-100 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/20 dark:bg-white/5' : ''}`}>
                                            <td className="p-4 pl-8 font-medium text-slate-900 dark:text-white">{day.date}</td>
                                            <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-300">{day.peakGuests}</td>
                                            <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-300">{day.totalEntries}</td>
                                            <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-300">{day.totalGuests}</td>
                                            <td className="p-4 pr-8 text-center font-mono font-bold text-slate-800 dark:text-white">{day.guestsAtEndOfDay}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                             ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p>{t('noHistory')}</p>
                                </div>
                             )}
                        </div>
                     </div>
                 </div>
            )}
        </>
    );
};

export default App;