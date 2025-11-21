import React, { useMemo, useRef, useEffect } from 'react';
import { Gender, LogEntry } from './types';
import { translations } from './locales';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry[];
  counts: { [key in Gender]: number };
  maxCapacity: number;
  showOther: boolean;
  t: (key: keyof typeof translations.en, replacements?: {[key: string]: string}) => string;
}

// --- SVG Chart Components ---

const LineChart: React.FC<{ data: { label: string, value: number }[], height: number, color: string }> = ({ data, height, color }) => {
  const maxValue = Math.max(...data.map(d => d.value), 5);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full h-full group">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
             {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" vectorEffect="non-scaling-stroke" className="text-slate-400 dark:text-slate-600" />
            ))}
            
            <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                </linearGradient>
            </defs>

            {/* Area under line */}
            <polygon
                fill="url(#fillGradient)"
                points={`0,100 ${points} 100,100`}
                className={`${color}`}
                vectorEffect="non-scaling-stroke"
            />
            
            {/* Line */}
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                points={points}
                className={`${color} drop-shadow-md`}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            
            {/* Dots */}
            {data.map((d, i) => (
                 d.value > 0 && (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1)) * 100}
                        cy={100 - (d.value / maxValue) * 100}
                        r="4"
                        className={`${color} fill-white dark:fill-slate-900 stroke-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        stroke="currentColor"
                        vectorEffect="non-scaling-stroke"
                    />
                 )
            ))}
        </svg>
        {/* X-Axis Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 transform translate-y-6">
            {data.filter((_, i) => i % 4 === 0).map((d, i) => (
                <span key={i}>{d.label}</span>
            ))}
        </div>
    </div>
  );
};

const BarChart: React.FC<{ data: { label: string, value: number }[], color: string }> = ({ data, color }) => {
    const maxValue = Math.max(...data.map(d => d.value), 5);
    
    return (
        <div className="w-full h-full flex items-end justify-between space-x-2">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                    <div 
                        className={`w-full rounded-xl transition-all duration-500 ${color} opacity-80 hover:opacity-100 hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]`}
                        style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: '4px' }}
                    ></div>
                     {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 whitespace-nowrap z-10 pointer-events-none shadow-xl backdrop-blur-sm">
                        {d.label}: {d.value}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-white rotate-45"></div>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">{d.label}</div>
                </div>
            ))}
        </div>
    )
}

const HorizontalBarChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    
    return (
        <div className="flex flex-col space-y-5 w-full px-2">
            {data.map((d, i) => (
                <div key={i} className="w-full group">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{d.label}</span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{d.value} <span className="text-slate-400 text-xs font-normal ml-1">({total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner relative">
                        <div 
                            className={`h-full rounded-full ${d.color} shadow-lg relative overflow-hidden transition-all duration-1000 ease-out`} 
                            style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        </div>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}


// --- Main Component ---

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose, log, counts, maxCapacity, showOther, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previouslyFocused.current = document.activeElement as HTMLElement;
            modalRef.current?.focus();
        } else {
             previouslyFocused.current?.focus();
        }
    }, [isOpen]);

    // KPI Calculations
    const totalEntriesToday = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return log.filter(l => l.action === 'in' && l.timestamp >= startOfDay).length;
    }, [log]);

    const totalGuests = Object.values(counts).reduce((a, b) => a + b, 0);
    const occupancy = (totalGuests / maxCapacity) * 100;

    const busiestHour = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const hourCounts = new Array(24).fill(0);
        
        log.forEach(entry => {
            if (entry.action === 'in' && entry.timestamp >= startOfDay) {
                hourCounts[entry.timestamp.getHours()]++;
            }
        });
        
        const max = Math.max(...hourCounts);
        const hour = hourCounts.indexOf(max);
        return max > 0 ? `${hour}:00 - ${hour + 1}:00` : '--:--';
    }, [log]);

    // Chart Data Preparation
    const hourlyData = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const hours = new Array(24).fill(0);
        
        log.forEach(entry => {
            if (entry.action === 'in' && entry.timestamp >= startOfDay) {
                hours[entry.timestamp.getHours()]++;
            }
        });

        // Create data for current hour
        const currentHour = today.getHours();
        return hours.slice(0, currentHour + 1).map((val, i) => ({
            label: `${i}`,
            value: val
        }));
    }, [log]);

    const weeklyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(d);
            nextDay.setDate(d.getDate() + 1);
            
            const count = log.filter(l => l.action === 'in' && l.timestamp >= d && l.timestamp < nextDay).length;
            days.push({
                label: d.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0),
                value: count
            });
        }
        return days;
    }, [log]);

    const demographicsData = useMemo(() => {
        const data = [
            { label: t('genderMale'), value: counts[Gender.Male], color: 'bg-blue-500' },
            { label: t('genderFemale'), value: counts[Gender.Female], color: 'bg-pink-500' }
        ];
        if (showOther) {
            data.push({ label: t('genderOther'), value: counts[Gender.Other], color: 'bg-purple-500' });
        }
        return data.sort((a, b) => b.value - a.value);
    }, [counts, showOther, t]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div 
                ref={modalRef}
                className="relative w-full max-w-6xl glass-panel rounded-[3rem] shadow-2xl flex flex-col overflow-hidden h-[90vh] animate-in zoom-in-95 duration-300 border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
                tabIndex={-1}
                role="dialog" 
                aria-modal="true"
                aria-label={t('analyticsTitle')}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-8 border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            {t('analyticsTitle')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hover:scale-110 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-8 pb-12 flex-1 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-lg border border-white/60 dark:border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute right-4 top-4 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{t('kpiTodayEntries')}</h3>
                            <p className="text-5xl font-light text-slate-900 dark:text-white">{totalEntriesToday}</p>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-lg border border-white/60 dark:border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
                             <div className="absolute right-4 top-4 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v4h4v-4zm-4-4h-4v4h4V5zm4 0v4h4V5h-4z"/></svg>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{t('kpiCurrentOccupancy')}</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-light text-slate-900 dark:text-white">{occupancy.toFixed(0)}<span className="text-2xl">%</span></p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">/ {maxCapacity}</p>
                            </div>
                             {/* Mini bar */}
                             <div className="w-full bg-slate-200 dark:bg-black/30 h-1.5 rounded-full mt-4 overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${Math.min(occupancy, 100)}%` }}></div>
                             </div>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-lg border border-white/60 dark:border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
                             <div className="absolute right-4 top-4 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                            </div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{t('kpiPeakHour')}</h3>
                            <p className="text-4xl font-light text-slate-900 dark:text-white">{busiestHour}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Hourly Traffic */}
                        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/60 dark:border-white/5 lg:col-span-2">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30"></span>
                                {t('chartHourly')}
                            </h3>
                            <div className="h-72 w-full">
                                {hourlyData.length > 0 ? (
                                     <LineChart data={hourlyData} height={250} color="text-indigo-500" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">{t('analyticsNoData')}</div>
                                )}
                            </div>
                        </div>

                         {/* Weekly History */}
                         <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/60 dark:border-white/5">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30"></span>
                                {t('chartWeekly')}
                            </h3>
                            <div className="h-64 w-full">
                                <BarChart data={weeklyData} color="bg-gradient-to-t from-cyan-500 to-blue-400" />
                            </div>
                        </div>

                        {/* Demographics */}
                        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/60 dark:border-white/5">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30"></span>
                                {t('chartDemographics')}
                            </h3>
                            <div className="h-64 flex items-center justify-center">
                                 {totalGuests > 0 ? (
                                    <HorizontalBarChart data={demographicsData} />
                                 ) : (
                                    <div className="text-slate-400 font-medium text-center">{t('analyticsNoData')}</div>
                                 )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;