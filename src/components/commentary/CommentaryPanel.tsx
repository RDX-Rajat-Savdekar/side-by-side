import React from 'react';
import { Commit, SummaryRow } from '../../types/lesson';
import { MermaidViewer } from './MermaidViewer';
import { QuizCard } from './QuizCard';
import { FileText, BarChart3, ChevronRight, ChevronLeft } from 'lucide-react';

interface CommentaryPanelProps {
  commit: Commit;
  summary?: SummaryRow[];
  isLastStep: boolean;
  onSelectLine: (line: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  commit,
  summary,
  isLastStep,
  onSelectLine,
  isOpen,
  onToggleOpen,
  width,
  onResizeStart,
}) => {
  // Parse markdown into HTML and replace `(Line X)` with clickable badges!
  const renderInteractiveMarkdown = (text: string) => {
    if (!text) return { __html: '' };

    let html = escapeHtml(text);

    // Replace (Line X) or Line X with clickable line badges
    html = html.replace(/\(?Line\s+(\d+)\)?/gi, (match, lineNum) => {
      return `<button class="line-badge" data-line="${lineNum}">Line ${lineNum}</button>`;
    });

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code inline: `text`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bullet lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs
    html = html.split(/\n\n+/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<ul>') || p.startsWith('<li>')) return p;
      return `<p>${p}</p>`;
    }).join('');

    return { __html: html };
  };

  // Handle clicking line badges inside notes
  const handleNotesClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('line-badge')) {
      const line = parseInt(target.dataset.line || '0', 10);
      if (line > 0) onSelectLine(line);
    }
  };

  if (!isOpen) {
    return (
      <aside
        className="commentary-panel collapsed"
        onClick={onToggleOpen}
        title="Expand Architect's Commentary"
      >
        <button
          className="btn-icon expand-btn"
          aria-label="Expand panel"
          onClick={(e) => {
            e.stopPropagation();
            onToggleOpen();
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="vertical-collapsed-label">
          <FileText size={16} className="text-accent-blue" />
          <span>Architect's Commentary</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="commentary-panel" style={{ width: `${width}px` }}>
      {/* Left resize handle */}
      <div className="resize-handle left-resize-handle" onMouseDown={onResizeStart} title="Drag to resize panel width" />

      <div className="panel-header">
        <div className="panel-title">
          <FileText size={16} className="text-accent-blue" />
          <h2>Architect's Commentary</h2>
        </div>
        <button
          className="btn-icon"
          onClick={onToggleOpen}
          aria-label="Collapse panel"
          title="Collapse commentary panel"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="commentary-body">
        {/* Architect Notes */}
        <div className="notes-card">
          <div className="card-header">
            <div className="card-title">
              <span>📋</span>
              <span>Architect's Notes</span>
            </div>
          </div>
          <div
            className="card-body markdown-content"
            dangerouslySetInnerHTML={renderInteractiveMarkdown(commit.architect_notes)}
            onClick={handleNotesClick}
          />
        </div>

        {/* Mermaid Class Diagram */}
        {commit.mermaid && <MermaidViewer chart={commit.mermaid} />}

        {/* FAANG Interview Pivot Quiz Card */}
        <QuizCard question={commit.pivot_question} />

        {/* Refactoring Summary (only on final step) */}
        {isLastStep && summary && summary.length > 0 && (
          <div className="summary-card">
            <div className="card-header">
              <div className="card-title">
                <BarChart3 size={16} className="text-accent-purple" />
                <span>Refactoring Summary</span>
              </div>
            </div>
            <div className="card-body">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Principle</th>
                    <th>Violation</th>
                    <th>Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-accent-blue">{row.principle}</td>
                      <td className="text-accent-red">{row.violation}</td>
                      <td className="text-accent-green">{row.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
