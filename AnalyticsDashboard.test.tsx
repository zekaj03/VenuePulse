import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { Gender } from './types';
import { translations } from './locales';
import React from 'react';

// Mock translations function
const t = (key: any) => {
    const en = translations.en as any;
    return en[key] || key;
};

describe('AnalyticsDashboard Stale Data Bug', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should update hourly data when opened at a later time', () => {
        // 1. Set time to 10:00 AM
        const date1 = new Date('2023-01-01T10:00:00');
        vi.setSystemTime(date1);

        const log: any[] = [];
        const counts = { [Gender.Male]: 0, [Gender.Female]: 0, [Gender.Other]: 0 };

        // 2. Render with isOpen=false (or true, doesn't matter for initial cache)
        // But to simulate the "stale" effect effectively:
        // The component is mounted in the App.
        const { rerender } = render(
            <AnalyticsDashboard
                isOpen={false}
                onClose={() => {}}
                log={log}
                counts={counts}
                maxCapacity={100}
                showOther={true}
                t={t}
            />
        );

        // The useMemo hooks have run now, capturing 10:00 AM as "today".

        // 3. Advance time to 15:00 PM (5 hours later)
        const date2 = new Date('2023-01-01T15:00:00');
        vi.setSystemTime(date2);

        // 4. Open the dashboard (re-render with isOpen=true)
        rerender(
            <AnalyticsDashboard
                isOpen={true}
                onClose={() => {}}
                log={log}
                counts={counts}
                maxCapacity={100}
                showOther={true}
                t={t}
            />
        );

        // 5. Check for labels in the chart.
        // At 10:00, data goes up to index 10. Labels shown (step 4): 0, 4, 8.
        // At 15:00, data goes up to index 15. Labels shown (step 4): 0, 4, 8, 12.

        // We expect to see "12" if the chart updated.
        // We expect NOT to see "12" if the bug exists.

        // Note: The LineChart logic:
        // data.filter((_, i) => i % 4 === 0).map(...)
        // Indices: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (length 11) -> 0, 4, 8
        // Indices: 0, ..., 15 (length 16) -> 0, 4, 8, 12

        const label12 = screen.queryByText('12');

        // EXPECT FAILURE: The bug means label12 will be null
        expect(label12).not.toBeNull();
    });
});
