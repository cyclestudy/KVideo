'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icon';
import { SearchLoadingAnimation } from '@/components/SearchLoadingAnimation';
import { SearchHistoryDropdown } from '@/components/search/SearchHistoryDropdown';
import { useSearchHistory } from '@/lib/hooks/useSearchHistory';

interface SearchFormProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading: boolean;
  initialQuery?: string;
  currentSource?: string;
  checkedSources?: number;
  totalSources?: number;
}

export function SearchForm({
  onSearch,
  onClear,
  isLoading,
  initialQuery = '',
  currentSource = '',
  checkedSources = 0,
  totalSources = 16,
}: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search history hook
  const {
    searchHistory,
    isDropdownOpen,
    highlightedIndex,
    showDropdown,
    hideDropdown,
    addSearch,
    removeSearch,
    clearAll,
    selectHistoryItem,
    navigateDropdown,
    resetHighlight,
  } = useSearchHistory((selectedQuery) => {
    setQuery(selectedQuery);
    onSearch(selectedQuery);
    // Blur the input after selecting from history
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  });

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Add to search history before searching
      addSearch(query.trim());
      onSearch(query);
      hideDropdown();
      // Blur the input to remove focus
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
    resetHighlight();
  };

  const handleInputFocus = () => {
    // Always show dropdown when focused, regardless of content
    showDropdown();
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the new focus target is within the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('.search-history-dropdown')) {
      // Don't hide dropdown if focus moved to dropdown
      return;
    }
    hideDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateDropdown('down');
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateDropdown('up');
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && searchHistory[highlightedIndex]) {
          e.preventDefault();
          selectHistoryItem(searchHistory[highlightedIndex].query);
        }
        break;
      case 'Escape':
        hideDropdown();
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="relative group" style={{ isolation: 'isolate' }}>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="搜索电影、电视剧、综艺..."
          className="text-base sm:text-lg pr-28 sm:pr-36 md:pr-44 truncate"
          aria-label="搜索视频内容"
          aria-expanded={isDropdownOpen}
          aria-controls="search-history-dropdown"
          aria-autocomplete="list"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-[var(--text-color)] opacity-70 hover:opacity-100 transition-opacity touch-manipulation"
              aria-label="清除搜索"
            >
              <Icons.X size={20} />
            </button>
          )}
          <Button
            type="submit"
            disabled={!query.trim()}
            variant="primary"
            className="px-3 sm:px-4 md:px-6"
          >
            <span className="flex items-center gap-2">
              <Icons.Search size={20} />
              <span className="hidden sm:inline">搜索</span>
            </span>
          </Button>
        </div>

        {/* Search History Dropdown */}
        <SearchHistoryDropdown
          isOpen={isDropdownOpen}
          searchHistory={searchHistory}
          highlightedIndex={highlightedIndex}
          triggerRef={inputRef}
          onSelectItem={selectHistoryItem}
          onRemoveItem={removeSearch}
          onClearAll={clearAll}
        />
      </div>
      
      {/* Loading Animation */}
      {isLoading && (
        <div className="mt-4">
          <SearchLoadingAnimation 
            currentSource={currentSource}
            checkedSources={checkedSources}
            totalSources={totalSources}
          />
        </div>
      )}
    </form>
  );
}
