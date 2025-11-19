'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SearchForm } from '@/components/search/SearchForm';
import { VideoGrid } from '@/components/search/VideoGrid';
import { NoResults } from '@/components/search/NoResults';
import { ResultsHeader } from '@/components/search/ResultsHeader';
import { TypeBadges } from '@/components/search/TypeBadges';
import { SourceBadges } from '@/components/search/SourceBadges';
import { PopularFeatures } from '@/components/home/PopularFeatures';
import { WatchHistorySidebar } from '@/components/history/WatchHistorySidebar';
import { useSearchCache } from '@/lib/hooks/useSearchCache';
import { useParallelSearch } from '@/lib/hooks/useParallelSearch';
import { useTypeBadges } from '@/lib/hooks/useTypeBadges';
import { useSourceBadges } from '@/lib/hooks/useSourceBadges';
import { settingsStore } from '@/lib/store/settings-store';

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadFromCache, saveToCache } = useSearchCache();
  const hasLoadedCache = useRef(false);
  
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSortBy, setCurrentSortBy] = useState('default');

  // Search stream hook
  const {
    loading,
    results,
    availableSources,
    completedSources,
    totalSources,
    totalVideosFound,
    performSearch,
    resetSearch,
    loadCachedResults,
    applySorting,
  } = useParallelSearch(
    saveToCache,
    (q: string) => router.replace(`/?q=${encodeURIComponent(q)}`, { scroll: false })
  );

  // Load sort preference on mount
  useEffect(() => {
    const settings = settingsStore.getSettings();
    setCurrentSortBy(settings.sortBy);
  }, []);

  // Source badges hook - filters by video source
  const {
    selectedSources,
    filteredVideos: sourceFilteredVideos,
    toggleSource,
  } = useSourceBadges(results, availableSources);

  // Type badges hook - auto-collects and filters by type_name
  // Apply on source-filtered results for combined filtering
  const {
    typeBadges,
    selectedTypes,
    filteredVideos: finalFilteredVideos,
    toggleType,
  } = useTypeBadges(sourceFilteredVideos);

  // Load cached results on mount
  useEffect(() => {
    if (hasLoadedCache.current) return;
    hasLoadedCache.current = true;

    const urlQuery = searchParams.get('q');
    const cached = loadFromCache();
    
    if (urlQuery) {
      setQuery(urlQuery);
      if (cached && cached.query === urlQuery && cached.results.length > 0) {
        console.log('📦 Loading cached results for:', urlQuery, cached.results.length, 'videos');
        setHasSearched(true);
        loadCachedResults(cached.results, cached.availableSources);
      } else {
        console.log('🔍 Auto-searching for URL query:', urlQuery);
        setTimeout(() => handleSearch(urlQuery), 100);
      }
    }
  }, [searchParams, loadFromCache, loadCachedResults]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setHasSearched(true);
    performSearch(searchQuery, currentSortBy as any);
  };

  const handleReset = () => {
    setHasSearched(false);
    setQuery('');
    resetSearch();
    router.replace('/', { scroll: false });
  };

  return (
    <div className="min-h-screen">
      {/* Glass Navbar */}
      <nav className="sticky top-0 z-50 pt-4 pb-2" style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform'
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[var(--glass-bg)] backdrop-blur-[12px] saturate-[120%] [-webkit-backdrop-filter:blur(12px)_saturate(120%)] border border-[var(--glass-border)] shadow-[var(--shadow-md)] px-6 py-4 rounded-[var(--radius-2xl)]" style={{
            transform: 'translate3d(0, 0, 0)'
          }}>
            <div className="flex items-center justify-between">
              <Link 
                href="/" 
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                onClick={handleReset}
              >
                <div className="w-10 h-10 relative flex items-center justify-center">
                  <Image 
                    src="/icon.png" 
                    alt="KVideo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-color)]">KVideo</h1>
                  <p className="text-xs text-[var(--text-color-secondary)]">视频聚合平台</p>
                </div>
              </Link>
              
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-full)] bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)] transition-all duration-200"
                  aria-label="设置"
                >
                  <svg className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor">
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                  </svg>
                </Link>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Form - Separate from navbar */}
      <div className="max-w-7xl mx-auto px-4 mt-6 mb-8 relative" style={{
        transform: 'translate3d(0, 0, 0)',
        zIndex: 1000
      }}>
        <SearchForm
          onSearch={handleSearch}
          onClear={handleReset}
          isLoading={loading}
          initialQuery={query}
          currentSource=""
          checkedSources={completedSources}
          totalSources={totalSources}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Results Section */}
        {(results.length >= 1 || (!loading && results.length > 0)) && (
          <div className="animate-fade-in">
            <ResultsHeader
              loading={loading}
              resultsCount={results.length}
              availableSources={availableSources}
            />
            
            {/* Source Badges - Clickable video source filtering */}
            {availableSources.length > 0 && (
              <SourceBadges
                sources={availableSources}
                selectedSources={selectedSources}
                onToggleSource={toggleSource}
                className="mb-6"
              />
            )}
            
            {/* Type Badges - Auto-collected from search results */}
            {typeBadges.length > 0 && (
              <TypeBadges
                badges={typeBadges}
                selectedTypes={selectedTypes}
                onToggleType={toggleType}
                className="mb-6"
              />
            )}
            
            {/* Display filtered videos (both source and type filters applied) */}
            <VideoGrid videos={finalFilteredVideos} />
          </div>
        )}

        {/* Popular Features - Homepage */}
        {!loading && !hasSearched && <PopularFeatures onSearch={handleSearch} />}

        {/* No Results */}
        {!loading && hasSearched && results.length === 0 && (
          <NoResults onReset={handleReset} />
        )}
      </main>

      {/* Watch History Sidebar */}
      <WatchHistorySidebar />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
