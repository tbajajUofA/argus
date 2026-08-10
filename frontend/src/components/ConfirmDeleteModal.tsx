import { AlertTriangle, Trash2, X } from 'lucide-react';
import Dialog from './Dialog';

type Props = {
  open: boolean;
  title: string;
  items: string[];
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({ open, title, items, busy, error, onCancel, onConfirm }: Props) {
  const shown = items.slice(0, 10);
  const remaining = items.length - shown.length;

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onCancel()}
      labelledBy="delete-modal-title"
      className="confirm-dialog"
    >
      <div className="dialog-header">
        <div className="dialog-title-group">
          <div className="danger-icon"><AlertTriangle size={22} aria-hidden /></div>
          <div>
            <p className="eyebrow">Permanent action</p>
            <h2 id="delete-modal-title">{title}</h2>
          </div>
        </div>
        <button type="button" className="icon-button" aria-label="Close" disabled={busy} onClick={onCancel}>
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="dialog-body">
        <p className="dialog-description">This removes the PDF and all generated embeddings. This can’t be undone.</p>
        {items.length > 0 && (
          <ul className="modal-list">
            {shown.map((name) => <li key={name}>{name}</li>)}
            {remaining > 0 && <li className="doc-meta">…and {remaining} more</li>}
          </ul>
        )}
        {error && <p className="error-banner inset-banner" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger-solid" disabled={busy} onClick={onConfirm}>
            <Trash2 size={17} aria-hidden />
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
