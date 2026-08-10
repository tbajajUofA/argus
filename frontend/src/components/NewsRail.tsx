import { useEffect, useState } from 'react';
import { CircleCheck, Clock3, Newspaper } from 'lucide-react';
import { getNews } from '../api';
import type { NewsItem } from '../types';

export default function NewsRail() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    getNews()
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
    const t = setInterval(() => {
      getNews()
        .then((r) => setItems(r.items))
        .catch(() => undefined);
    }, 20000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="news-rail">
      <div className="rail-heading-row">
        <Newspaper size={18} aria-hidden />
        <p className="rail-heading">Updates</p>
      </div>
      <div className="news-list" aria-live="polite">
        {!items.length && <p className="empty compact-empty">Nothing new right now.</p>}
        {items.map((item, i) => (
          <article key={`${item.title}-${i}`} className={`news-card news-${item.kind}`}>
            <div className="news-card-title">
              {item.kind === 'ready' ? <CircleCheck size={16} aria-hidden /> : <Clock3 size={16} aria-hidden />}
              <h3>{item.title}</h3>
            </div>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
