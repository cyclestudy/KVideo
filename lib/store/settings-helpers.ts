import type { AppSettings } from './settings-store';

export const SEARCH_HISTORY_KEY = 'kvideo-search-history';
export const WATCH_HISTORY_KEY = 'kvideo-watch-history';

export const sortOptions = {
    'default': '默认排序',
    'relevance': '按相关性',
    'latency-asc': '延迟低到高',
    'date-desc': '发布时间（新到旧）',
    'date-asc': '发布时间（旧到新）',
    'rating-desc': '按评分（高到低）',
    'name-asc': '按名称（A-Z）',
    'name-desc': '按名称（Z-A）',
} as const;

export function exportSettings(settings: AppSettings, includeHistory: boolean = true): string {
    const exportData: Record<string, unknown> = {
        settings,
    };

    if (includeHistory && typeof window !== 'undefined') {
        const searchHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
        const watchHistory = localStorage.getItem(WATCH_HISTORY_KEY);

        if (searchHistory) exportData.searchHistory = JSON.parse(searchHistory);
        if (watchHistory) exportData.watchHistory = JSON.parse(watchHistory);
    }

    return JSON.stringify(exportData, null, 2);
}

export function importSettings(
    jsonString: string,
    saveSettings: (settings: AppSettings) => void
): boolean {
    try {
        const data = JSON.parse(jsonString);

        if (data.settings) {
            saveSettings(data.settings);
        }

        if (data.searchHistory && typeof window !== 'undefined') {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(data.searchHistory));
        }

        if (data.watchHistory && typeof window !== 'undefined') {
            localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(data.watchHistory));
        }

        return true;
    } catch {
        return false;
    }
}
