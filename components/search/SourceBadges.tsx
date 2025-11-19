/**
 * SourceBadges - Clickable video source badges with filtering
 * Shows available video sources with counts
 * Click to filter videos by source
 * Similar functionality to TypeBadges
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';

interface Source {
  id: string;
  name: string;
  count: number;
}

interface SourceBadgesProps {
  sources: Source[];
  selectedSources: Set<string>;
  onToggleSource: (sourceId: string) => void;
  className?: string;
}

export const SourceBadges = memo(function SourceBadges({ 
  sources, 
  selectedSources,
  onToggleSource,
  className = '' 
}: SourceBadgesProps) {
  if (sources.length === 0) {
    return null;
  }

  const handleClearAll = () => {
    selectedSources.forEach(sourceId => onToggleSource(sourceId));
  };

  return (
    <Card 
      hover={false} 
      className={`p-4 animate-fade-in bg-[var(--bg-color)]/50 backdrop-blur-none saturate-100 shadow-sm border-[var(--glass-border)] ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Icons.Globe size={16} className="text-[var(--accent-color)]" />
          <span className="text-sm font-semibold text-[var(--text-color)]">
            视频源 ({sources.length}):
          </span>
        </div>
        
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          {sources.map((source) => {
            const isSelected = selectedSources.has(source.id);
            
            return (
              <button
                key={source.id}
                onClick={() => onToggleSource(source.id)}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2
                  rounded-full
                  border-2
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-200 ease-out
                  hover:scale-105 hover:shadow-[var(--shadow-sm)]
                  active:scale-95
                  focus:outline-none
                  ${isSelected 
                    ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-md' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-color)] border-[var(--glass-border)] hover:border-[var(--accent-color)]'
                  }
                `}
              >
                <span>{source.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  }
                `}>
                  {source.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {selectedSources.size > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
          <button
            onClick={handleClearAll}
            className="text-xs text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] 
                     flex items-center gap-1 transition-colors"
          >
            <Icons.X size={12} />
            清除筛选 ({selectedSources.size})
          </button>
        </div>
      )}
    </Card>
  );
});
