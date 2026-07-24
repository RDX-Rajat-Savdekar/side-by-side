import React from 'react';
import { Commit } from '../../types/lesson';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrubberBarProps {
  commits: Commit[];
  currentStep: number;
  visitedStepKeys: Set<string>;
  lessonId: string;
  onNavigateStep: (step: number) => void;
}

export const ScrubberBar: React.FC<ScrubberBarProps> = ({
  commits,
  currentStep,
  visitedStepKeys,
  lessonId,
  onNavigateStep,
}) => {
  const totalSteps = commits.length;
  const progressPct = totalSteps > 1 ? currentStep / (totalSteps - 1) : 0;

  return (
    <footer id="scrubber-bar" className="scrubber-bar">
      <button
        id="scrubber-prev"
        className="scrubber-arrow"
        disabled={currentStep === 0}
        onClick={() => onNavigateStep(currentStep - 1)}
        title="Previous commit (←)"
      >
        <ChevronLeft size={16} />
      </button>

      <div id="scrubber-track">
        <div className="scrubber-line-bg" />
        <div
          id="scrubber-line-fill"
          className="scrubber-line-fill"
          style={{ width: `calc((100% - 24px) * ${progressPct})` }}
        />
        <div id="scrubber-nodes">
          {commits.map((commit, idx) => {
            const isActive = idx === currentStep;
            const isVisited = !isActive && visitedStepKeys.has(`${lessonId}-${idx}`);
            const isFirst = idx === 0;
            const isLast = idx === totalSteps - 1;
            const shortLabel = commit.title.replace(/^Commit \d+:\s*/, '');

            const alignmentClass = isFirst ? 'align-start' : isLast ? 'align-end' : 'align-center';

            return (
              <button
                key={idx}
                className={`scrubber-node ${alignmentClass} ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`}
                onClick={() => onNavigateStep(idx)}
                title={commit.title}
              >
                <span className="scrubber-dot" />
                <span className="scrubber-node-label">{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        id="scrubber-next"
        className="scrubber-arrow"
        disabled={currentStep === totalSteps - 1}
        onClick={() => onNavigateStep(currentStep + 1)}
        title="Next commit (→)"
      >
        <ChevronRight size={16} />
      </button>

      <div id="scrubber-counter" className="scrubber-counter">
        <span id="current-step-display">{currentStep + 1}</span>
        <span className="counter-sep">/</span>
        <span id="total-steps-display">{totalSteps}</span>
      </div>
    </footer>
  );
};
