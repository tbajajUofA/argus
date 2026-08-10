import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, FileQuestion, Layers3, Mail, Sparkles, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { extractPages, listDocuments, listSections, study } from '../api';
import PdfViewer from '../components/PdfViewer';
import { useMe } from '../me';
import type { Document, DocumentSection, Source, StudyMode } from '../types';

type FlashcardItem = { front: string; back: string; citations?: string[] };
type QuizItem = { question: string; answer: string; citations?: string[] };

export default function StudyPage() {
  const me = useMe();
  const [params] = useSearchParams();
  const [docs, setDocs] = useState<Document[]>([]);
  const [docId, setDocId] = useState(params.get('document') || '');
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [mode, setMode] = useState<StudyMode>('quiz');
  const [emailMe, setEmailMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [citationErrors, setCitationErrors] = useState<string[]>([]);
  const [pdfDocId, setPdfDocId] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);

  const readyDocs = useMemo(() => docs.filter((d) => d.status === 'ready'), [docs]);

  useEffect(() => {
    listDocuments().then(setDocs).catch(() => setDocs([]));
  }, []);

  useEffect(() => {
    if (!docId) {
      setSections([]);
      setSectionId('');
      return;
    }
    listSections(docId)
      .then((secs) => {
        setSections(secs);
        setSectionId(secs[0]?.id || '');
      })
      .catch(() => {
        setSections([]);
        setSectionId('');
      });
  }, [docId]);

  const generate = async () => {
    if (!docId || busy) return;
    if (sections.length && !sectionId) {
      setError('Pick a chapter/section.');
      return;
    }
    setBusy(true);
    setError('');
    setStructured(null);
    try {
      const result = await study(docId, mode, sectionId || null, emailMe);
      setStructured(result.structured || null);
      setSources(result.sources);
      setCitationErrors(result.eval?.citation_errors || []);
      if (result.sources[0]) {
        setPdfDocId(result.sources[0].document_id);
        setPdfPage(result.sources[0].page_number || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const openPage = (page: number) => {
    if (sources[0]) {
      setPdfDocId(sources[0].document_id);
      setPdfPage(page);
    }
  };

  return (
    <div className="study-page">
      <header className="feed-header">
        <p className="eyebrow">Focused learning</p>
        <div className="page-heading-row">
          <div>
            <h1>Study</h1>
            <p className="feed-sub">Choose a chapter and shape it into material that works for you.</p>
          </div>
          {me && !me.is_admin && me.study.remaining_today != null && (
            <span className="usage-badge">{me.study.remaining_today} of {me.study.daily_limit} left</span>
          )}
        </div>
      </header>

      <div className="study-controls">
        <div className="control-group">
          <label className="field-inline">
            <span><BookOpen size={15} aria-hidden /> Textbook</span>
            <select value={docId} onChange={(e) => setDocId(e.target.value)}>
              <option value="">Select textbook</option>
              {readyDocs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </label>
          <label className="field-inline">
            <span><Layers3 size={15} aria-hidden /> Chapter or section</span>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!sections.length}>
              {!sections.length && <option value="">Whole book</option>}
              {sections.map((s) => <option key={s.id} value={s.id}>{s.title} (p{s.start_page}–{s.end_page})</option>)}
            </select>
          </label>
        </div>

        <div>
          <span className="control-label">Material</span>
          <div className="segmented-control" role="group" aria-label="Study material">
            {([
              ['quiz', 'Quiz', FileQuestion],
              ['flashcards', 'Cards', Layers3],
              ['summary', 'Summary', Sparkles],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                className={mode === value ? 'active' : ''}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                <Icon size={16} aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="study-action-row">
          <label className="switch-row">
            <span><Mail size={17} aria-hidden /> Email me a copy</span>
            <input type="checkbox" checked={emailMe} onChange={(e) => setEmailMe(e.target.checked)} />
          </label>
          <button type="button" className="btn btn-primary generate-button" disabled={!docId || busy} onClick={generate}>
            <Sparkles size={17} aria-hidden />
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {error && <p className="error-banner" role="alert">{error}</p>}
      {citationErrors.length > 0 && (
        <p className="warn-banner">Citation warnings: {citationErrors.join('; ')}</p>
      )}

      <div className="study-results" aria-busy={busy}>
        {busy && <div className="generation-status" aria-live="polite"><span className="pulse-dot" />Building your study pack…</div>}
        {mode === 'quiz' && Array.isArray(structured?.items) ? (
          <div className="material-list">
            {(structured!.items as QuizItem[]).map((item, i) => (
              <div key={i} className="material-card">
                <p className="material-q">{item.question}</p>
                <p className="material-a">{item.answer}</p>
                <div className="cite-row">
                  {extractPages((item.citations || []).join(' ')).map((p) => (
                    <button key={p} type="button" className="post-chip" onClick={() => openPage(p)}>
                      p{p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {mode === 'flashcards' && Array.isArray(structured?.items) ? (
          <div className="material-list">
            {(structured!.items as FlashcardItem[]).map((item, i) => (
              <div key={i} className="material-card">
                <p className="material-q">{item.front}</p>
                <p className="material-a">{item.back}</p>
                <div className="cite-row">
                  {extractPages((item.citations || []).join(' ')).map((p) => (
                    <button key={p} type="button" className="post-chip" onClick={() => openPage(p)}>
                      p{p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {mode === 'summary' && structured ? (
          <div className="material-card summary-card">
            <h2>{String(structured.title || 'Summary')}</h2>
            {((structured.outline as { heading: string; bullets: string[] }[]) || []).map((sec, i) => (
              <div key={i} className="summary-sec">
                <h3>{sec.heading}</h3>
                <ul>
                  {sec.bullets?.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {!structured && !busy ? (
          <div className="empty-state">
            <div className="empty-icon"><Sparkles size={25} aria-hidden /></div>
            <p className="empty-title">Ready when you are</p>
            <p className="muted">Choose a textbook, a chapter, and the material you want to create.</p>
          </div>
        ) : null}
      </div>

      {pdfDocId && (
        <div className="pdf-dock">
          <div className="pdf-modal-bar">
            <span>Source PDF · p{pdfPage}</span>
            <button type="button" className="icon-button compact" aria-label="Hide source PDF" onClick={() => setPdfDocId(null)}>
              <X size={18} aria-hidden />
            </button>
          </div>
          <PdfViewer documentId={pdfDocId} page={pdfPage} />
        </div>
      )}
    </div>
  );
}
