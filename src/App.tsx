import React, { useState, useEffect, useCallback } from 'react';
import { useLessonState } from './hooks/useLessonState';
import { Header } from './components/header/Header';
import { ExplorerSidebar } from './components/explorer/ExplorerSidebar';
import { MonacoDiffViewer } from './components/workspace/MonacoDiffViewer';
import { ScrubberBar } from './components/workspace/ScrubberBar';
import { CommentaryPanel } from './components/commentary/CommentaryPanel';
import { GeneratorModal } from './components/modals/GeneratorModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const {
    subjects,
    currentLesson,
    currentStep,
    searchQuery,
    setSearchQuery,
    diffViewMode,
    setDiffViewMode,
    commentaryOpen,
    setCommentaryOpen,
    commentaryWidth,
    setCommentaryWidth,
    navOpen,
    setNavOpen,
    navWidth,
    setNavWidth,
    visitedStepKeys,
    completedLessonIds,
    selectLesson,
    navigateStep,
    addCustomLesson,
    deleteCustomLesson,
    exportAllCustomLessons,
    customLessonsCount,
  } = useLessonState();

  const [generatorOpen, setGeneratorOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [targetLine, setTargetLine] = useState<number | null>(null);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;
      if (generatorOpen || shortcutsOpen) {
        if (e.key === 'Escape') {
          setGeneratorOpen(false);
          setShortcutsOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          navigateStep(currentStep + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          navigateStep(currentStep - 1);
          break;
        case 'Home':
          e.preventDefault();
          navigateStep(0);
          break;
        case 'End':
          e.preventDefault();
          if (currentLesson) navigateStep(currentLesson.commits.length - 1);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setDiffViewMode(prev => {
            if (prev === 'split') return 'unified';
            if (prev === 'unified') return 'single';
            return 'split';
          });
          break;
        case '?':
          e.preventDefault();
          setShortcutsOpen(prev => !prev);
          break;
        case 'b':
        case 'B':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setNavOpen(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, currentLesson, generatorOpen, shortcutsOpen, navigateStep, setDiffViewMode]);

  // Handle Sidebar Resize (Explorer)
  const handleNavResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = navWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(500, startWidth + (moveEvent.clientX - startX)));
      setNavWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [navWidth, setNavWidth]);

  // Handle Commentary Panel Resize (Drag Left)
  const handleCommentaryResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = commentaryWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Dragging left increases width (startX - clientX)
      const newWidth = Math.max(260, Math.min(750, startWidth + (startX - moveEvent.clientX)));
      setCommentaryWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [commentaryWidth, setCommentaryWidth]);

  const commits = currentLesson?.commits || [];
  const activeCommit = commits[currentStep];
  const beforeCode = currentStep > 0 ? commits[currentStep - 1].code : '';
  const afterCode = activeCommit?.code || '';
  const isLastStep = currentStep === commits.length - 1;
  const lessonId = currentLesson?.id || currentLesson?.title || '';
  const isLessonCompleted = completedLessonIds.has(lessonId);

  return (
    <div className="app-root">
      <Header
        onToggleNav={() => setNavOpen(!navOpen)}
        onOpenGenerator={() => setGeneratorOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        diffViewMode={diffViewMode}
        onChangeViewMode={setDiffViewMode}
        onExportLessons={exportAllCustomLessons}
        customLessonsCount={customLessonsCount}
      />

      <div id="app-layout">
        {navOpen && (
          <ExplorerSidebar
            subjects={subjects}
            currentLesson={currentLesson}
            currentStep={currentStep}
            visitedStepKeys={visitedStepKeys}
            completedLessonIds={completedLessonIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectLesson={selectLesson}
            onDeleteCustomLesson={deleteCustomLesson}
            width={navWidth}
            onResizeStart={handleNavResizeStart}
          />
        )}

        <section id="workspace">
          {currentLesson && activeCommit ? (
            <>
              <div id="workspace-header">
                <div className="workspace-header-left">
                  <div className="commit-badge">
                    <span className="step-number">{activeCommit.step}</span>
                  </div>
                  <h2 className="commit-title">{activeCommit.title}</h2>
                  {isLessonCompleted && (
                    <span className="badge-completed">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                </div>

                <div className="diff-labels">
                  {diffViewMode !== 'single' && (
                    <span className="label-before">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      Before (Naive)
                    </span>
                  )}
                  <span className="label-after">
                    <ShieldCheck size={12} className="text-accent-green" />
                    {diffViewMode === 'single' ? 'Refactored Implementation' : 'After (Refactored)'}
                  </span>
                </div>
              </div>

              <div id="diff-container">
                <MonacoDiffViewer
                  beforeCode={beforeCode}
                  afterCode={afterCode}
                  language={currentLesson.language || 'python'}
                  diffViewMode={diffViewMode}
                  targetLine={targetLine}
                />
              </div>

              <ScrubberBar
                commits={commits}
                currentStep={currentStep}
                visitedStepKeys={visitedStepKeys}
                lessonId={lessonId}
                onNavigateStep={navigateStep}
              />
            </>
          ) : (
            <div id="empty-state" className="empty-state">
              <div className="empty-icon">🧬</div>
              <h2>Welcome to Code Evolution</h2>
              <p>Select a lesson from the sidebar or generate a new LLM diff lesson to begin.</p>
              <button className="btn-empty" onClick={() => setGeneratorOpen(true)}>
                Generate New Lesson
              </button>
            </div>
          )}
        </section>

        {currentLesson && activeCommit && (
          <CommentaryPanel
            commit={activeCommit}
            summary={currentLesson.summary}
            isLastStep={isLastStep}
            onSelectLine={(line) => setTargetLine(line)}
            isOpen={commentaryOpen}
            onToggleOpen={() => setCommentaryOpen(!commentaryOpen)}
            width={commentaryWidth}
            onResizeStart={handleCommentaryResizeStart}
          />
        )}
      </div>

      <GeneratorModal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onImportLesson={addCustomLesson}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
};
