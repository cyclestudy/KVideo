export type DoubanHotItem = {
  id: string;
  title: string;
  rank: number;
  rating: number | null;
  link: string;
  cover: string;
  year?: string;
  subtype?: string;
};

const DOUBAN_HOT_ENDPOINT =
  'https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit=20&page_start=0';

/**
 * Fetches the Douban hot list using the public search endpoint.
 * Note: Douban may apply rate limits or CORS restrictions in certain environments.
 */
export async function fetchDoubanHot(): Promise<DoubanHotItem[]> {
  const response = await fetch(DOUBAN_HOT_ENDPOINT, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Douban hot list: ${response.status}`);
  }

  const data: { subjects?: Array<Record<string, unknown>> } = await response.json();

  if (!data.subjects || !Array.isArray(data.subjects)) {
    throw new Error('Invalid Douban hot response format');
  }

  return data.subjects.map((subject, index) => {
    const title = String(subject.title ?? '');
    const rateValue = subject.rate ? Number(subject.rate) : null;
    const rating = Number.isFinite(rateValue) ? rateValue : null;

    return {
      id: String(subject.id ?? index),
      title,
      rank: index + 1,
      rating,
      link: String(subject.url ?? ''),
      cover: String(subject.cover ?? ''),
      year: subject.year ? String(subject.year) : undefined,
      subtype: subject.subtype ? String(subject.subtype) : undefined,
    } satisfies DoubanHotItem;
  });
}
