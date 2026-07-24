import React, { useState } from 'react';
import { BASE_PROMPT } from '../../data/seedData';
import { Lesson } from '../../types/lesson';
import { Zap, Copy, Check, Import, AlertCircle, X, FileUp } from 'lucide-react';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLesson: (lesson: Lesson) => void;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  onClose,
  onImportLesson,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(BASE_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      setStatus({ type: 'error', message: 'Please paste JSON or drop a file first.' });
      return;
    }

    try {
      let rawStr = jsonText.trim();
      const fenceMatch = rawStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (fenceMatch) rawStr = fenceMatch[1].trim();

      const data = JSON.parse(rawStr);

      if (!data.title || !data.commits || !Array.isArray(data.commits) || data.commits.length === 0) {
        throw new Error('Missing required fields: title, commits (array with at least 1 commit)');
      }

      data.commits.forEach((c: any, idx: number) => {
        if (!c.code || !c.title) {
          throw new Error(`Commit ${idx + 1} missing required fields: title, code`);
        }
        if (!c.step) c.step = idx + 1;
        if (!c.architect_notes) c.architect_notes = '';
        if (!c.pivot_question) c.pivot_question = '';
      });

      if (!data.id) data.id = `custom-${Date.now()}`;
      if (!data.subject) data.subject = 'Low-Level Design';
      if (!data.chapter) data.chapter = 'Custom Lessons';
      if (!data.language) data.language = 'python';

      onImportLesson(data);
      setStatus({ type: 'success', message: `✓ Imported "${data.title}" successfully!` });
      setTimeout(() => {
        onClose();
        setJsonText('');
        setStatus({ type: '', message: '' });
      }, 1000);

    } catch (err: any) {
      setStatus({ type: 'error', message: `Import Error: ${err.message}` });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonText(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Zap size={20} className="text-accent-cyan" />
            <h2>AI Lesson Generator & Importer</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1 */}
          <div className="modal-section">
            <div className="section-number">1</div>
            <div className="section-content">
              <h3>Copy Prompt Template</h3>
              <p className="section-desc">
                Copy this prompt template into ChatGPT, Claude, or Gemini. Customize the <code>[TOPIC]</code> placeholder.
              </p>
              <pre className="prompt-preview">{BASE_PROMPT}</pre>
              <button className={`btn-primary ${copied ? 'success' : ''}`} onClick={handleCopyPrompt}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Base Prompt'}</span>
              </button>
            </div>
          </div>

          <div className="modal-divider" />

          {/* Step 2 */}
          <div className="modal-section">
            <div className="section-number">2</div>
            <div className="section-content">
              <h3>Paste LLM JSON Response</h3>
              <p className="section-desc">
                Paste the raw JSON response or upload a <code>.json</code> file below:
              </p>

              <div className="file-upload-row">
                <label className="btn-secondary file-input-label">
                  <FileUp size={14} />
                  <span>Upload .json File</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} hidden />
                </label>
              </div>

              <textarea
                className="json-input"
                placeholder='{ "title": "Rate Limiter", "commits": [...] }'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
              />

              <div className="import-row">
                <button className="btn-primary" onClick={handleImport}>
                  <Import size={14} />
                  <span>Import Lesson</span>
                </button>
                {status.message && (
                  <div className={`import-status ${status.type}`}>
                    {status.type === 'error' && <AlertCircle size={14} />}
                    <span>{status.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
