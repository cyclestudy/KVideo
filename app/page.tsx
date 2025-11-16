'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import Image from 'next/image';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Get all enabled source IDs
      const sourceIds = ['custom_0', 'custom_1', 'custom_2', 'custom_3', 'custom_4', 
                         'custom_5', 'custom_6', 'custom_7', 'custom_8', 'custom_9',
                         'custom_10', 'custom_11', 'custom_12', 'custom_13', 'custom_14', 'custom_15'];
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sources: sourceIds }),
      });
      const data = await response.json();
      
      if (data.success) {
        const allResults = data.sources.flatMap((s: any) => s.results);
        setResults(allResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: any) => {
    const params = new URLSearchParams({
      id: video.vod_id,
      source: video.source,
      title: video.vod_name,
    });
    router.push(`/player?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Glass Navbar */}
      <nav className="sticky top-4 z-50 mx-4 mt-4 mb-8">
        <div className="max-w-7xl mx-auto bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] [-webkit-backdrop-filter:blur(25px)_saturate(180%)] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-md)] px-6 py-4 transition-all duration-[var(--transition-fluid)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image 
                  src="/favicon.ico" 
                  alt="KVideo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-color)]">
                  KVideo
                </h1>
                <p className="text-xs text-[var(--text-color-secondary)]">视频聚合平台</p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero Section with Search */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-5xl md:text-6xl font-bold text-[var(--text-color)] mb-4">
            发现精彩视频
          </h2>
          <p className="text-xl text-[var(--text-color-secondary)] mb-8">
            多源聚合 · 智能搜索 · 极致体验
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative group">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索电影、电视剧、综艺..."
                className="text-lg pr-32"
              />
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-8"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    搜索中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Search size={20} />
                    搜索
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-3">
                <span>搜索结果</span>
                <Badge variant="primary">{results.length} 个视频</Badge>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {results.map((video, index) => (
                <Card
                  key={`${video.vod_id}-${index}`}
                  onClick={() => handleVideoClick(video)}
                  className="p-0 overflow-hidden group"
                >
                  {/* Poster */}
                  <div className="relative aspect-[2/3] bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)]">
                    {video.vod_pic ? (
                      <img
                        src={video.vod_pic}
                        alt={video.vod_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {video.type_name && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {video.type_name}
                          </Badge>
                        )}
                        {video.vod_year && (
                          <div className="flex items-center gap-1 text-white/80 text-xs">
                            <Icons.Calendar size={12} />
                            <span>{video.vod_year}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 group-hover:text-[var(--accent-color)] transition-colors">
                      {video.vod_name}
                    </h4>
                    {video.vod_remarks && (
                      <p className="text-xs text-[var(--text-color-secondary)] mt-1 line-clamp-1">
                        {video.vod_remarks}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !query && (
          <div className="text-center py-20 animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-[var(--radius-full)] bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] mb-6">
                <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-color)] mb-4">
                开始探索精彩内容
              </h3>
              <p className="text-lg text-[var(--text-color-secondary)] max-w-2xl mx-auto mb-8">
                在上方搜索框输入关键词，从 16 个视频源聚合搜索海量影视资源
              </p>
              
              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                <Card hover={false} className="text-center p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Icons.Zap size={48} className="text-[var(--accent-color)]" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-color)] mb-2">极速搜索</h4>
                  <p className="text-sm text-[var(--text-color-secondary)]">多源并行，秒级响应</p>
                </Card>
                <Card hover={false} className="text-center p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Icons.Target size={48} className="text-[var(--accent-color)]" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-color)] mb-2">精准匹配</h4>
                  <p className="text-sm text-[var(--text-color-secondary)]">智能算法，结果精准</p>
                </Card>
                <Card hover={false} className="text-center p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Icons.Sparkles size={48} className="text-[var(--accent-color)]" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-color)] mb-2">极致体验</h4>
                  <p className="text-sm text-[var(--text-color-secondary)]">流畅播放，完美适配</p>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-[var(--radius-full)] bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] mb-6">
              <Icons.Search size={64} className="text-[var(--text-color-secondary)]" />
            </div>
            <h3 className="text-3xl font-bold text-[var(--text-color)] mb-4">
              未找到相关内容
            </h3>
            <p className="text-lg text-[var(--text-color-secondary)]">
              试试其他关键词或检查拼写
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
