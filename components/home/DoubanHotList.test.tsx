import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoubanHotList } from './DoubanHotList';
import { DoubanHotItem } from '@/lib/services/doubanHot';

const items: DoubanHotItem[] = [
  {
    id: '1',
    title: '无名',
    rank: 1,
    rating: 8.5,
    link: 'https://example.com/1',
    cover: 'https://img1.doubanio.com/cover1.jpg',
    year: '2024',
    subtype: 'movie',
  },
  {
    id: '2',
    title: '流浪地球',
    rank: 2,
    rating: null,
    link: 'https://example.com/2',
    cover: '',
  },
];

describe('DoubanHotList', () => {
  it('renders loading placeholders', () => {
    render(<DoubanHotList items={[]} loading />);
    expect(screen.getByText('豆瓣热榜')).toBeInTheDocument();
    expect(screen.getByText('实时刷新，看看大家都在关注什么')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders error state with retry', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<DoubanHotList items={[]} error="网络异常" onRetry={onRetry} />);

    expect(screen.getByText('加载失败：网络异常')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders list items', () => {
    render(<DoubanHotList items={items} />);

    expect(screen.getByText('无名')).toBeInTheDocument();
    expect(screen.getByText('流浪地球')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('评分 8.5')).toBeInTheDocument();
    expect(screen.getByText('movie')).toBeInTheDocument();
  });
});
