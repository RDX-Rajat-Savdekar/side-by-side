import React from 'react';
import { DiffViewMode } from '../../types/lesson';
import { Columns, GitCommit, HelpCircle, Download, Plus, LayoutList, Eye } from 'lucide-react';

interface HeaderProps {
  onToggleNav: () => void;
  onOpenGenerator: () => void;
  onOpenShortcuts: () => void;
  diffViewMode: DiffViewMode;
  onChangeViewMode: (mode: DiffViewMode) => void;
  onExportLessons: () => void;
  customLessonsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleNav,
  onOpenGenerator,
  onOpenShortcuts,
  diffViewMode,
  onChangeViewMode,
  onExportLessons,
  customLessonsCount
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          onClick={onToggleNav} 
          className="btn-icon" 
          aria-label="Toggle navigation" 
          title="Toggle sidebar (Ctrl+B)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="logo">
          <span className="logo-icon">🧬</span>
          <h1>Code Evolution</h1>
          <span className="logo-badge">LLD v2</span>
        </div>
      </div>

      <div className="header-right">
        {/* View Mode Toggle Controls */}
        <div className="view-mode-selector" title="Diff View Mode">
          <button
            className={`btn-mode ${diffViewMode === 'split' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('split')}
            title="Split Diff View (Side-by-side)"
          >
            <Columns size={14} />
            <span>Split</span>
          </button>
          <button
            className={`btn-mode ${diffViewMode === 'unified' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('unified')}
            title="Unified Inline Diff View"
          >
            <LayoutList size={14} />
            <span>Inline</span>
          </button>
          <button
            className={`btn-mode ${diffViewMode === 'single' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('single')}
            title="Single Code View (Refactored code only)"
          >
            <Eye size={14} />
            <span>Code</span>
          </button>
        </div>

        {customLessonsCount > 0 && (
          <button 
            className="btn-secondary" 
            onClick={onExportLessons}
            title="Export all custom imported lessons"
          >
            <Download size={14} />
            <span>Backup ({customLessonsCount})</span>
          </button>
        )}

        <button 
          className="btn-icon" 
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={18} />
        </button>

        <button className="btn-generate" onClick={onOpenGenerator}>
          <Plus size={16} />
          <span>Generate Lesson</span>
        </button>
      </div>
    </header>
  );
};
