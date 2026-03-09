import { useRef, useState } from 'react';
import type { Document, User } from '../types';
import { UploadSimple, FileText, Eye, CircleNotch, ArrowLeft } from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Props {
  documents: Document[];
  roomId: string;
  token: string;
  currentUser: User;
}

export default function DocumentPanel({ documents, roomId, token }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await fetch(`${API_URL}/rooms/${roomId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
    } catch (e) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="doc-panel">
      {viewingDoc ? (
        <div className="doc-viewer">
          <div className="doc-viewer-header">
            <button className="btn-icon" onClick={() => setViewingDoc(null)} style={{ background: 'none' }}>
              <ArrowLeft size={16} weight="bold" />
            </button>
            <span className="doc-viewer-name">{viewingDoc.name}</span>
          </div>
          <div className="doc-viewer-content">
            {viewingDoc.extractedText ? (
              <pre className="doc-text">{viewingDoc.extractedText}</pre>
            ) : (
              <div className="doc-no-text">
                <FileText weight="light" size={20} />
                <p>No text extracted from this document</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            className="doc-upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
            />
            {uploading ? (
              <div className="upload-state">
                <CircleNotch size={20} weight="bold" className="spinning" />
                <p>Uploading & extracting text...</p>
              </div>
            ) : (
              <div className="upload-state">
                <UploadSimple size={24} weight="bold" />
                <p>Drop document or click to upload</p>
                <span className="upload-hint">PDF, TXT, DOC</span>
              </div>
            )}
          </div>

          {error && <div className="doc-error">{error}</div>}

          {documents.length === 0 ? (
            <div className="doc-empty">
              <FileText weight="light" size={20} />
              <p className="doc-empty-title">No documents yet</p>
              <p className="doc-empty-desc">Upload a technical manual for AI analysis</p>
            </div>
          ) : (
            <div className="doc-list">
              <div className="doc-list-header">
                {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
              </div>
              {documents.map(doc => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-item-icon">
                    <FileText size={18} weight="bold" />
                  </div>
                  <div className="doc-item-info">
                    <div className="doc-item-name">{doc.name}</div>
                    <div className="doc-item-meta">
                      {doc.uploaderName} &middot; {new Date(doc.timestamp).toLocaleTimeString()}
                    </div>
                    {doc.extractedText && (
                      <div className="doc-item-preview">
                        {doc.extractedText.slice(0, 100)}...
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => setViewingDoc(doc)}
                    title="View content"
                    style={{ background: 'none' }}
                  >
                    <Eye size={18} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .doc-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .doc-upload-zone {
          margin: 12px;
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-md);
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .doc-upload-zone:hover {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .upload-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--text-tertiary);
        }
        .upload-state p {
          font-size: 0.8125rem;
          font-weight: 500;
          margin: 0;
          color: var(--text-secondary);
        }
        .upload-hint {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }
        .spinning { animation: spin 1s linear infinite; }
        .doc-error {
          margin: 0 12px;
          padding: 8px 12px;
          background: var(--danger-muted);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--danger);
        }
        .doc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--text-tertiary);
          text-align: center;
          padding: 40px 32px;
        }
        .doc-empty svg { opacity: 0.3; margin-bottom: 4px; }
        .doc-empty-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }
        .doc-empty-desc {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin: 0;
        }
        .doc-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .doc-list-header {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--text-tertiary);
          padding: 8px 0 4px;
        }
        .doc-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px;
          transition: border-color 0.15s;
        }
        .doc-item:hover {
          border-color: var(--border-default);
        }
        .doc-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
        }
        .doc-item-info {
          flex: 1;
          min-width: 0;
        }
        .doc-item-name {
          font-size: 0.8125rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-item-meta {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .doc-item-preview {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          margin-top: 4px;
          line-height: 1.4;
        }
        .doc-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .doc-viewer-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .doc-viewer-name {
          font-size: 0.8125rem;
          font-weight: 600;
        }
        .doc-viewer-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .doc-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          line-height: 1.7;
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .doc-no-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-tertiary);
          margin-top: 40px;
        }
        @media (max-width: 640px) {
          .doc-upload-zone {
            margin: 10px;
            padding: 16px;
          }
          .doc-empty {
            padding: 24px 16px;
          }
          .doc-list {
            padding: 0 10px 10px;
          }
          .doc-item {
            padding: 10px;
          }
          .doc-item-name {
            font-size: 0.875rem;
          }
          .doc-item-meta {
            font-size: 0.75rem;
          }
          .doc-item-preview {
            font-size: 0.75rem;
          }
          .doc-item .btn-icon {
            min-width: 44px;
            min-height: 44px;
          }
          .doc-viewer-header {
            padding: 10px;
          }
          .doc-viewer-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }
          .doc-viewer-content {
            padding: 12px;
          }
          .doc-text {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}
