import React, { useState } from 'react';
import { Subject, Lesson } from '../../types/lesson';
import { Search, ChevronRight, ChevronDown, CheckCircle2, Trash2, BookOpen, FileText } from 'lucide-react';

interface ExplorerSidebarProps {
  subjects: Subject[];
  currentLesson: Lesson | null;
  currentStep: number;
  visitedStepKeys: Set<string>;
  completedLessonIds: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectLesson: (lesson: Lesson, stepIndex: number) => void;
  onDeleteCustomLesson: (lessonId: string) => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  subjects,
  currentLesson,
  currentStep,
  visitedStepKeys,
  completedLessonIds,
  searchQuery,
  onSearchChange,
  onSelectLesson,
  onDeleteCustomLesson,
  width,
  onResizeStart,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Filter lessons based on search query
  const matchesSearch = (lesson: Lesson) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(q) ||
      (lesson.chapter && lesson.chapter.toLowerCase().includes(q)) ||
      (lesson.subject && lesson.subject.toLowerCase().includes(q)) ||
      (lesson.summary && lesson.summary.some(s => s.principle.toLowerCase().includes(q) || s.violation.toLowerCase().includes(q)))
    );
  };

  return (
    <aside className="nav-panel" style={{ width: `${width}px` }}>
      <div className="nav-header">
        <span className="nav-title">EXPLORER</span>
        <div className="nav-search-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search lessons & SOLID patterns..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => onSearchChange('')}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="nav-tree">
        {subjects.map((subject) => {
          const matchingChapters = subject.chapters.map(chap => ({
            ...chap,
            lessons: chap.lessons.filter(matchesSearch)
          })).filter(chap => chap.lessons.length > 0);

          if (searchQuery.trim() && matchingChapters.length === 0) return null;

          const isSubjectCollapsed = collapsedNodes[`sub-${subject.id}`];

          return (
            <div key={subject.id} className="nav-subject">
              <div
                className="nav-item-header"
                onClick={() => toggleCollapse(`sub-${subject.id}`)}
              >
                <span className="nav-chevron">
                  {isSubjectCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
                <span className="nav-icon">{subject.icon}</span>
                <span className="nav-label">{subject.name}</span>
              </div>

              {!isSubjectCollapsed && (
                <div className="nav-children">
                  {matchingChapters.length === 0 ? (
                    <div className="nav-empty">No matching lessons</div>
                  ) : (
                    matchingChapters.map((chapter) => {
                      const isChapterCollapsed = collapsedNodes[`chap-${chapter.id}`];

                      return (
                        <div key={chapter.id} className="nav-chapter">
                          <div
                            className="nav-item-header"
                            onClick={() => toggleCollapse(`chap-${chapter.id}`)}
                          >
                            <span className="nav-chevron">
                              {isChapterCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </span>
                            <span className="nav-icon"><BookOpen size={14} /></span>
                            <span className="nav-label">{chapter.name}</span>
                          </div>

                          {!isChapterCollapsed && (
                            <div className="nav-children">
                              {chapter.lessons.map((lesson) => {
                                const lessonId = lesson.id || lesson.title;
                                const isCurrentLesson = currentLesson?.id === lesson.id || currentLesson?.title === lesson.title;
                                const isCompleted = completedLessonIds.has(lessonId);

                                return (
                                  <div key={lessonId} className="nav-lesson">
                                    <div
                                      className={`nav-item-header lesson-header ${isCurrentLesson ? 'active' : ''}`}
                                      onClick={() => onSelectLesson(lesson, 0)}
                                    >
                                      <span className="nav-icon">
                                        {isCompleted ? (
                                          <CheckCircle2 size={14} className="text-accent-green" />
                                        ) : (
                                          <FileText size={14} />
                                        )}
                                      </span>
                                      <span className="nav-label">{lesson.title}</span>

                                      {/* Custom lesson delete trigger */}
                                      {lesson.id?.startsWith('custom-') || !['parking-lot-srp-ocp', 'srp-user-registration', 'ocp-shape-calculator', 'lsp-bird-hierarchy', 'isp-worker-system', 'dip-notification-system'].includes(lesson.id) ? (
                                        <button
                                          className="btn-delete-lesson"
                                          title="Delete custom lesson"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete "${lesson.title}"?`)) {
                                              onDeleteCustomLesson(lessonId);
                                            }
                                          }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      ) : null}
                                    </div>

                                    {/* Commit Step Nodes */}
                                    <div className="commit-timeline nav-children">
                                      {lesson.commits.map((commit, idx) => {
                                        const isStepActive = isCurrentLesson && currentStep === idx;
                                        const isStepVisited = visitedStepKeys.has(`${lessonId}-${idx}`);

                                        return (
                                          <button
                                            key={idx}
                                            className={`commit-node ${isStepActive ? 'active' : ''} ${isStepVisited ? 'visited' : ''}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectLesson(lesson, idx);
                                            }}
                                          >
                                            <span className="commit-dot"></span>
                                            <span className="commit-label">{commit.title}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="resize-handle" onMouseDown={onResizeStart} />
    </aside>
  );
};
