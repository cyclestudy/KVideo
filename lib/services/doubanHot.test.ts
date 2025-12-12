import { fetchDoubanHot } from './doubanHot';

const mockSubjects = [
  {
    id: '1',
    title: '第一条',
    rate: '8.5',
    url: 'https://movie.douban.com/subject/1/',
    cover: 'https://img1.doubanio.com/cover1.jpg',
    year: '2024',
    subtype: 'movie',
  },
  {
    id: '2',
    title: '第二条',
    rate: null,
    url: 'https://movie.douban.com/subject/2/',
    cover: 'https://img1.doubanio.com/cover2.jpg',
  },
];

describe('fetchDoubanHot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps Douban response to hot list items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ subjects: mockSubjects }),
    }) as unknown as typeof fetch;

    const result = await fetchDoubanHot();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: '1',
      title: '第一条',
      rank: 1,
      rating: 8.5,
      link: 'https://movie.douban.com/subject/1/',
      cover: 'https://img1.doubanio.com/cover1.jpg',
      year: '2024',
      subtype: 'movie',
    });
    expect(result[1]).toMatchObject({
      id: '2',
      rank: 2,
      rating: null,
    });
  });

  it('throws when response is invalid', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(fetchDoubanHot()).rejects.toThrow('Invalid Douban hot response format');
  });

  it('throws when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(fetchDoubanHot()).rejects.toThrow('Failed to fetch Douban hot list: 500');
  });
});
