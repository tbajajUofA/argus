import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileUp,
  GraduationCap,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  bulkDeleteDocuments,
  deleteDocument,
  getDocumentStatus,
  listDocuments,
  listFlashcardOffers,
  setFlashcardsOpen,
  subscribeFlashcards,
  unsubscribeFlashcards,
  uploadDocument,
} from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import PdfViewer from '../components/PdfViewer';
import { useMe } from '../me';
import type { Document, FlashcardOffer } from '../types';

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ready'
      ? 'status-ready'
      : status === 'error'
        ? 'status-error'
        : 'status-processing';
  const Icon = status === 'ready' ? CheckCircle2 : status === 'error' ? TriangleAlert : Clock3;
  return <span className={`status ${cls}`}><Icon size={13} aria-hidden />{status.replace(/_/g, ' ')}</span>;
}

type DeleteTarget = { ids: string[]; titles: string[]; label: string };

export default function LibraryPage() {
  const me = useMe();
  const isAdmin = Boolean(me?.is_admin);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [offers, setOffers] = useState<FlashcardOffer[]>([]);
  const [subBusy, setSubBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, offerList] = await Promise.all([listDocuments(), listFlashcardOffers()]);
      setDocs(list);
      setOffers(offerList);
      setSelected((prev) => {
        const ids = new Set(list.map((d) => d.id));
        return new Set([...prev].filter((id) => ids.has(id)));
      });
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const filteredDocs = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q),
    );
  }, [docs, searchFilter]);

  const pollUntilReady = async (id: string) => {
    for (let i = 0; i < 120; i++) {
      const st = await getDocumentStatus(id);
      if (st.status === 'ready' || st.status === 'error') {
        return st;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
  };

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0] ?? null;
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    if (file) {
      setPreviewFile(file);
      setPreviewBlobUrl(URL.createObjectURL(file));
      setPreviewDocId(null);
      setPreviewPage(1);
    } else {
      setPreviewFile(null);
      setPreviewBlobUrl(null);
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadMsg('Choose a PDF first.');
      return;
    }
    setUploading(true);
    setUploadMsg('Uploading…');
    try {
      const docTitle = title.trim() || file.name;
      const { id } = await uploadDocument(file, docTitle, description.trim() || undefined);
      setPreviewDocId(id);
      setPreviewFile(null);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setPreviewPage(1);
      setUploadMsg('Processing PDF…');
      const result = await pollUntilReady(id);
      if (result?.status === 'ready') {
        setUploadMsg('Ready to study.');
        setTitle('');
        setDescription('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setUploadMsg(result?.error_message || 'Processing failed.');
      }
      await refresh();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openBulkDelete = () => {
    if (!selected.size) return;
    const titles = docs.filter((d) => selected.has(d.id)).map((d) => d.title);
    setDeleteError('');
    setDeleteTarget({
      ids: [...selected],
      titles,
      label: `Delete ${titles.length} textbook(s)?`,
    });
  };

  const openSingleDelete = (doc: Document) => {
    setDeleteError('');
    setDeleteTarget({
      ids: [doc.id],
      titles: [doc.title],
      label: `Delete «${doc.title}»?`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteDocument(deleteTarget.ids[0]);
      } else {
        await bulkDeleteDocuments(deleteTarget.ids);
      }
      setSelected(new Set());
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const toggleFlashcardsOpen = async (doc: Document) => {
    setSubBusy(doc.id);
    try {
      await setFlashcardsOpen(doc.id, !doc.flashcards_open);
      await refresh();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : 'Failed to update signup');
    } finally {
      setSubBusy(null);
    }
  };

  const toggleSubscribe = async (documentId: string, subscribed: boolean) => {
    setSubBusy(documentId);
    try {
      if (subscribed) await unsubscribeFlashcards(documentId);
      else await subscribeFlashcards(documentId);
      await refresh();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : 'Subscription update failed');
    } finally {
      setSubBusy(null);
    }
  };

  return (
    <div className="library-page">
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteTarget?.label ?? ''}
        items={deleteTarget?.titles ?? []}
        busy={deleting}
        error={deleteError}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <header className="page-header">
        <p className="eyebrow">Your sources</p>
        <h1 className="page-title">Library</h1>
        <p className="page-sub">
          {isAdmin
            ? 'Add textbooks, monitor processing, and manage chapter collections.'
            : 'Browse available textbooks and turn chapters into focused study packs.'}
        </p>
      </header>

      {isAdmin && (
      <div className="upload-compact panel">
        <div className="section-heading">
          <div className="section-icon"><FileUp size={19} aria-hidden /></div>
          <div>
            <h2>Upload a textbook</h2>
            <p>PDFs are processed into searchable, source-linked chapters.</p>
          </div>
        </div>
        <div className="upload-row">
          <label className="sr-only" htmlFor="title">Textbook title</label>
          <input
            id="title"
            className="upload-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (defaults to filename)"
          />
          <label className="btn btn-ghost upload-file-btn">
            <Upload size={17} aria-hidden />
            {previewFile ? previewFile.name : 'Choose PDF'}
            <input
              id="pdf"
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={handleFileChange}
            />
          </label>
          <button type="button" className="btn btn-primary" disabled={uploading} onClick={handleUpload}>
            <Upload size={17} aria-hidden />
            {uploading ? 'Working…' : 'Upload'}
          </button>
        </div>
        <label className="sr-only" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="upload-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
        />
        {uploadMsg && <p aria-live="polite" className={uploadMsg.includes('Ready') ? 'success-message upload-msg' : 'upload-message upload-msg'}>{uploadMsg}</p>}
        <div className="upload-preview">
          <PdfViewer
            file={previewBlobUrl ?? previewFile ?? undefined}
            documentId={previewBlobUrl || previewFile ? null : previewDocId}
            page={previewPage}
            onPageChange={setPreviewPage}
          />
        </div>
      </div>
      )}

      {!isAdmin && previewDocId && (
        <div className="panel preview-panel">
          <PdfViewer documentId={previewDocId} page={previewPage} onPageChange={setPreviewPage} />
        </div>
      )}

      <section className={isAdmin ? 'library-section spaced' : 'library-section'}>
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Collection</p>
            <h2>Your textbooks</h2>
          </div>
          <span className="count-badge">{filteredDocs.length}</span>
        </div>
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden />
            <span className="sr-only">Search textbooks</span>
            <input
              placeholder="Search textbooks"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={refresh}>
            <RefreshCw size={16} aria-hidden /> Refresh
          </button>
          {isAdmin && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(new Set(docs.map((d) => d.id)))}>
                Select all
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(new Set())}>
                Clear
              </button>
              <button type="button" className="btn btn-danger" disabled={!selected.size || deleting} onClick={openBulkDelete}>
                <Trash2 size={16} aria-hidden /> Delete ({selected.size})
              </button>
            </>
          )}
          <Link to="/study" className="btn btn-primary">
            <GraduationCap size={17} aria-hidden /> Study
          </Link>
        </div>

        {loading && <p className="loading" aria-live="polite">Loading textbooks…</p>}
        {!loading && filteredDocs.length === 0 && (
          <div className="empty-state compact">
            <div className="empty-icon"><BookOpen size={24} aria-hidden /></div>
            <p className="empty-title">No textbooks found</p>
            <p className="muted">{searchFilter ? 'Try a different search.' : 'Add a PDF to start building your library.'}</p>
          </div>
        )}
        {filteredDocs.map((doc) => (
          <article key={doc.id} className="doc-row">
            <div className="doc-main">
              {isAdmin && (
                <input aria-label={`Select ${doc.title}`} type="checkbox" checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} />
              )}
              <div>
                <div className="doc-row-title">{doc.title}</div>
                <div className="doc-meta">
                  {doc.description ? `${doc.description} · ` : ''}
                  <StatusBadge status={doc.status} />
                  {doc.flashcards_open ? ' · Flashcard signup open' : ''}
                </div>
              </div>
            </div>
            <div className="doc-actions">
              {doc.status === 'ready' && (
                <Link to={`/study?document=${doc.id}`} className="btn btn-secondary">
                  <GraduationCap size={16} aria-hidden /> Study
                </Link>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => {
                setPreviewDocId(doc.id);
                setPreviewFile(null);
                if (previewBlobUrl) {
                  URL.revokeObjectURL(previewBlobUrl);
                  setPreviewBlobUrl(null);
                }
                setPreviewPage(1);
              }}>
                <Eye size={16} aria-hidden /> Preview
              </button>
              {isAdmin && doc.status === 'ready' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={subBusy === doc.id}
                  onClick={() => toggleFlashcardsOpen(doc)}
                >
                  {doc.flashcards_open ? 'Close flashcard signup' : 'Open flashcard signup'}
                </button>
              )}
              {isAdmin && (
                <button type="button" className="btn btn-danger" disabled={deleting} onClick={() => openSingleDelete(doc)}>
                  <Trash2 size={16} aria-hidden /> Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      {offers.length > 0 && (
        <section className="library-section spaced">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Email delivery</p>
              <h2>Flashcard signup</h2>
            </div>
          </div>
          <p className="section-description">
            {isAdmin
              ? 'Guests can subscribe to these textbooks. Generate flashcards in Study (one textbook) and send to subscribers.'
              : 'Subscribe to get flashcards by email when the admin sends a deck for that textbook. Unsubscribe anytime.'}
          </p>
          {offers.map((offer) => (
            <div key={offer.document_id} className="doc-row">
              <div>
                <div className="doc-row-title">{offer.title}</div>
                <div className="doc-meta">
                  {offer.description ? `${offer.description} · ` : ''}
                  {offer.subscriber_count} subscriber{offer.subscriber_count === 1 ? '' : 's'}
                  {offer.subscribed ? ' · You are subscribed' : ''}
                </div>
              </div>
              <button
                type="button"
                className={offer.subscribed ? 'btn btn-secondary' : 'btn btn-primary'}
                disabled={subBusy === offer.document_id}
                onClick={() => toggleSubscribe(offer.document_id, offer.subscribed)}
              >
                {offer.subscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
