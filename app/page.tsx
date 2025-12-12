'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { WatchHistorySidebar } from '@/components/history/WatchHistorySidebar';
import { DoubanHotList } from '@/components/home/DoubanHotList';
import { DoubanHotItem, fetchDoubanHot } from '@/lib/services/doubanHot';

function HomePage() {
  const [items, setItems] = useState<DoubanHotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHotList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoubanHot();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取热门列表失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotList();
  }, [loadHotList]);

  return (
    <div className="min-h-screen">
      <Navbar onReset={loadHotList} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-[var(--text-color)]">发现今日热门</h1>
          <p className="text-[var(--text-color-secondary)]">基于豆瓣热榜的实时精选，为你推荐当下最受关注的影视作品</p>
        </div>

        <DoubanHotList items={items} loading={loading} error={error} onRetry={loadHotList} />
      </main>

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
