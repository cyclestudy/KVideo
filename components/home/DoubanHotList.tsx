'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DoubanHotItem } from '@/lib/services/doubanHot';

type DoubanHotListProps = {
  items: DoubanHotItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

const PLACEHOLDER_COUNT = 8;

export function DoubanHotList({ items, loading, error, onRetry }: DoubanHotListProps) {
  if (loading) {
    return (
      <section className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-color)]">豆瓣热榜</h2>
            <p className="text-sm text-[var(--text-color-secondary)]">实时刷新，看看大家都在关注什么</p>
          </div>
          <div className="w-24 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] animate-pulse" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
            <div
              key={index}
              className="h-56 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4 flex gap-4 animate-pulse"
            >
              <div className="w-24 h-full rounded-xl bg-black/20" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 rounded-full bg-black/10" />
                <div className="h-4 w-1/2 rounded-full bg-black/10" />
                <div className="h-4 w-2/3 rounded-full bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-color)]">豆瓣热榜</h2>
            <p className="text-sm text-[var(--text-color-secondary)]">实时刷新，看看大家都在关注什么</p>
          </div>
        </header>
        <div className="rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-6 text-center">
          <p className="text-[var(--text-color-secondary)]">加载失败：{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-color)] text-white hover:opacity-90 transition"
            >
              重试
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-color)]">豆瓣热榜</h2>
          <p className="text-sm text-[var(--text-color-secondary)]">实时刷新，看看大家都在关注什么</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)] transition"
          >
            刷新
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-6 text-center">
          <p className="text-[var(--text-color-secondary)]">暂时没有热门内容，稍后再来看看吧。</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              href={item.link || '#'}
              key={item.id}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300"
            >
              <div className="relative h-48 w-full overflow-hidden">
                {item.cover ? (
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/40" />
                )}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-white text-sm font-semibold">
                  #{item.rank}
                </div>
                {item.rating && (
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-sm">
                    评分 {item.rating}
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold text-[var(--text-color)] line-clamp-2 min-h-[3.25rem]">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--text-color-secondary)]">
                  {item.year && <span>{item.year}</span>}
                  {item.subtype && <span className="px-2 py-0.5 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)]">{item.subtype}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
