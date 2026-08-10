import { Fragment, useEffect, useState } from 'react';
import { Boxes, ChevronDown, ChevronUp, Database, ExternalLink, FileText } from 'lucide-react';
import { getAdminChunks, getAdminConfig, getAdminStats, type AdminConfig, type AdminStats } from '../api';

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [samples, setSamples] = useState<Record<string, { text: string; page_number: number }[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAdminConfig(), getAdminStats()])
      .then(([cfg, st]) => {
        setConfig(cfg);
        setStats(st);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const toggleSamples = async (docId: string) => {
    if (expanded === docId) {
      setExpanded(null);
      return;
    }
    setExpanded(docId);
    if (!samples[docId]) {
      try {
        const res = await getAdminChunks(docId, 3);
        setSamples((prev) => ({
          ...prev,
          [docId]: res.chunks.map((c) => ({ text: c.text, page_number: c.page_number })),
        }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load chunks');
      }
    }
  };

  return (
    <div className="admin-page">
      <header className="page-header">
        <p className="eyebrow">System inspector</p>
        <h1 className="page-title">Database</h1>
        <p className="page-sub">Monitor textbooks, vector coverage, and storage connections.</p>
      </header>

      {config && (config.supabaseTableUrl || config.storageUrl) && (
        <div className="panel dashboard-panel">
          <div className="section-heading">
            <div className="section-icon"><Database size={19} aria-hidden /></div>
            <div><h2>Supabase dashboard</h2><p>Open the underlying data and file storage.</p></div>
          </div>
          <div className="toolbar">
            {config.supabaseTableUrl && (
              <a href={config.supabaseTableUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                Table editor <ExternalLink size={15} aria-hidden />
              </a>
            )}
            {config.storageUrl && (
              <a href={config.storageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                Storage bucket <ExternalLink size={15} aria-hidden />
              </a>
            )}
          </div>
        </div>
      )}

      {error && <p className="error-banner" role="alert">{error}</p>}

      {stats && (
        <>
          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <div className="stat-icon"><FileText size={20} aria-hidden /></div>
              <div className="admin-stat">{stats.document_count}</div>
              <div className="admin-stat-label">Textbooks</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon"><Boxes size={20} aria-hidden /></div>
              <div className="admin-stat">{stats.total_vectors}</div>
              <div className="admin-stat-label">Vector chunks</div>
            </div>
          </div>

          <div className="panel admin-table-panel">
            <div className="section-title-row">
              <div><p className="eyebrow">Index coverage</p><h2>Documents</h2></div>
              <span className="count-badge">{stats.documents.length}</span>
            </div>
            <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Pages</th>
                  <th>Chunks</th>
                  <th>Storage</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.documents.map((doc) => (
                  <Fragment key={doc.id}>
                    <tr>
                      <td>{doc.title}</td>
                      <td>{doc.status}</td>
                      <td>{doc.total_pages ?? '—'}</td>
                      <td>{doc.chunk_count}</td>
                      <td className="doc-meta storage-cell" title={doc.storage_path || undefined}>
                        {doc.storage_path || '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary compact-button"
                          aria-expanded={expanded === doc.id}
                          onClick={() => toggleSamples(doc.id)}
                        >
                          {expanded === doc.id ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
                          {expanded === doc.id ? 'Hide' : 'Sample'}
                        </button>
                      </td>
                    </tr>
                    {expanded === doc.id && samples[doc.id] && (
                      <tr>
                        <td colSpan={6}>
                          {samples[doc.id].map((c, i) => (
                            <div key={i} className="source-item">
                              <div className="source-item-title">p{c.page_number}</div>
                              <div className="source-excerpt">{c.text}</div>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {!stats && !error && <p className="loading" aria-live="polite">Loading database details…</p>}
    </div>
  );
}
