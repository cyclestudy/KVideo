'use client';

import { Suspense } from 'react';
import { SearchForm } from '@/components/search/SearchForm';
import { NoResults } from '@/components/search/NoResults';
import { Navbar } from '@/components/layout/Navbar';
import { SearchResults } from '@/components/home/SearchResults';
import { useSecretHomePage } from '@/lib/hooks/useSecretHomePage';

function SecretHomePage() {
    const {
        query,
        hasSearched,
        loading,
        results,
        availableSources,
        completedSources,
        totalSources,
        handleSearch,
        handleReset,
    } = useSecretHomePage();

    return (
        <div className="min-h-screen bg-black">
            {/* Glass Navbar */}
            <Navbar onReset={handleReset} />

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
                    <SearchResults
                        results={results}
                        availableSources={availableSources}
                        loading={loading}
                        openDirectLinks={true}
                    />
                )}

                {/* No Results */}
                {!loading && hasSearched && results.length === 0 && (
                    <NoResults onReset={handleReset} />
                )}

                {/* Empty State - Just show a dark placeholder or nothing for secret mode */}
                {!loading && !hasSearched && (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-color-secondary)]">
                        <p>Secret Mode Active</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SecretPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent"></div>
            </div>
        }>
            <SecretHomePage />
        </Suspense>
    );
}
