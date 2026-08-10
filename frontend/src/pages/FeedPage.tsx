import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileText, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFeed } from '../api';
import Dialog from '../components/Dialog';
import PdfViewer from '../components/PdfViewer';
import type { FeedPost } from '../types';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfDocId, setPdfDocId] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const res = await getFeed(50);
      setPosts(res.posts);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="feed-page">
      <header className="feed-header">
        <p className="eyebrow">Your learning stream</p>
        <div className="page-heading-row">
          <div>
            <h1>Feed</h1>
            <p className="feed-sub">Fresh ideas from your textbooks, one chapter at a time.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Refresh feed" onClick={load}>
            <RefreshCw size={19} aria-hidden />
          </button>
        </div>
      </header>

      {loading && (
        <div className="skeleton-list" aria-label="Loading feed" aria-live="polite">
          {[0, 1, 2].map((item) => <div key={item} className="skeleton-card" />)}
        </div>
      )}
      {error && <p className="error-banner" role="alert">{error}</p>}

      {!loading && !posts.length && (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={26} aria-hidden /></div>
          <p className="empty-title">Silence on the wire</p>
          <p className="muted">Add a textbook and its chapters will start sharing ideas here.</p>
          <Link className="btn btn-primary" to="/library">Open Library</Link>
        </div>
      )}

      <div className="feed-stream">
        {posts.map((post) => {
          const acc = post.account || { handle: 'unknown', display_name: 'Unknown', kind: 'textbook', avatar_key: '?' };
          return (
            <article key={post.id} className="post">
              <div className="post-avatar" aria-hidden>
                {(acc.avatar_key || acc.handle || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="post-body">
                <div className="post-meta">
                  <span className="post-name">{acc.display_name}</span>
                  <span className="post-handle">@{acc.handle}</span>
                  <span className="post-kind">{acc.kind}</span>
                  {post.created_at && <span className="post-time">{timeAgo(String(post.created_at))}</span>}
                </div>
                <p className="post-text">{post.body}</p>
                <div className="post-actions">
                  {post.document_id && post.page_number != null && (
                    <button
                      type="button"
                      className="post-chip"
                      onClick={() => {
                        setPdfDocId(post.document_id!);
                        setPdfPage(Number(post.page_number));
                      }}
                    >
                      <FileText size={15} aria-hidden />
                      Page {post.page_number}
                    </button>
                  )}
                  {post.leetcode_url && (
                    <a className="post-chip leetcode" href={post.leetcode_url} target="_blank" rel="noreferrer">
                      LeetCode <ExternalLink size={14} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={pdfDocId !== null}
        onClose={() => setPdfDocId(null)}
        labelledBy="feed-pdf-title"
        className="pdf-dialog"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Source document</p>
            <h2 id="feed-pdf-title">Page {pdfPage}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close PDF" onClick={() => setPdfDocId(null)}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <PdfViewer documentId={pdfDocId} page={pdfPage} onPageChange={setPdfPage} />
      </Dialog>
    </div>
  );
}
