import { useState, useEffect } from 'react';
import { settingsStore, getDefaultSources, type SortOption } from '@/lib/store/settings-store';
import type { VideoSource } from '@/lib/types';

export function useSettingsPage() {
    const [sources, setSources] = useState<VideoSource[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isRestoreDefaultsDialogOpen, setIsRestoreDefaultsDialogOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<VideoSource | null>(null);

    useEffect(() => {
        const settings = settingsStore.getSettings();
        setSources(settings.sources || []);
        setSortBy(settings.sortBy);
    }, []);

    const handleSourcesChange = (newSources: VideoSource[]) => {
        setSources(newSources);
        settingsStore.saveSettings({ sources: newSources, sortBy, searchHistory: true, watchHistory: true });
    };

    const handleAddSource = (source: VideoSource) => {
        const exists = sources.some(s => s.id === source.id);
        const updated = exists
            ? sources.map(s => s.id === source.id ? source : s)
            : [...sources, source];
        handleSourcesChange(updated);
        setEditingSource(null);
    };

    const handleEditSource = (source: VideoSource) => {
        setEditingSource(source);
        setIsAddModalOpen(true);
    };

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort);
        settingsStore.saveSettings({ sources, sortBy: newSort, searchHistory: true, watchHistory: true });
    };

    const handleExport = (includeSearchHistory: boolean, includeWatchHistory: boolean) => {
        const data = settingsStore.exportSettings(includeSearchHistory || includeWatchHistory);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kvideo-settings-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (jsonString: string): boolean => {
        const success = settingsStore.importSettings(jsonString);
        if (success) {
            const settings = settingsStore.getSettings();
            setSources(settings.sources);
            setSortBy(settings.sortBy);
        }
        return success;
    };

    const handleRestoreDefaults = () => {
        const defaults = getDefaultSources();
        handleSourcesChange(defaults);
        setIsRestoreDefaultsDialogOpen(false);
    };

    const handleResetAll = () => {
        settingsStore.resetToDefaults();
        setIsResetDialogOpen(false);
        window.location.reload();
    };

    return {
        sources,
        sortBy,
        isAddModalOpen,
        isExportModalOpen,
        isImportModalOpen,
        isResetDialogOpen,
        isRestoreDefaultsDialogOpen,
        setIsAddModalOpen,
        setIsExportModalOpen,
        setIsImportModalOpen,
        setIsResetDialogOpen,
        setIsRestoreDefaultsDialogOpen,
        setEditingSource,
        handleSourcesChange,
        handleAddSource,
        handleSortChange,
        handleExport,
        handleImport,
        handleRestoreDefaults,
        handleResetAll,
        editingSource,
        handleEditSource,
    };
}
