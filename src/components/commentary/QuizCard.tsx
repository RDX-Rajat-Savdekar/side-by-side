import React, { useState } from 'react';
import { Target, HelpCircle, CheckCircle, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizCardProps {
  question: string;
}

export const QuizCard: React.FC<QuizCardProps> = ({ question }) => {
  const [revealed, setRevealed] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<'easy' | 'hard' | null>(null);

  const handleAssessment = (type: 'easy' | 'hard') => {
    setAssessment(type);
    if (type === 'easy') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleReset = () => {
    setRevealed(false);
    setAssessment(null);
  };

  if (!question) return null;

  return (
    <div className="pivot-card">
      <div className="card-header">
        <div className="card-title">
          <Target size={16} className="text-accent-red" />
          <span>FAANG Interview Pivot</span>
        </div>
        {revealed && (
          <button className="btn-icon" onClick={handleReset} title="Reset Question">
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="card-body">
        <p className="quiz-question">{question}</p>

        {!revealed ? (
          <button className="btn-quiz-reveal" onClick={() => setRevealed(true)}>
            <HelpCircle size={14} />
            <span>Reveal Key Insights</span>
          </button>
        ) : (
          <div className="quiz-answer-panel">
            <div className="answer-content">
              <strong>💡 Interviewer Solution Notes:</strong>
              <p>
                To answer this effectively: identify the core constraint violation (e.g. OCP or LSP), introduce an explicit boundary abstraction, and inject dependent capabilities rather than hardcoding.
              </p>
            </div>

            <div className="quiz-assessment-row">
              <span className="assessment-label">How did you do?</span>
              <div className="assessment-buttons">
                <button
                  className={`btn-assess easy ${assessment === 'easy' ? 'selected' : ''}`}
                  onClick={() => handleAssessment('easy')}
                >
                  <CheckCircle size={14} />
                  <span>Mastered</span>
                </button>
                <button
                  className={`btn-assess hard ${assessment === 'hard' ? 'selected' : ''}`}
                  onClick={() => handleAssessment('hard')}
                >
                  <span>Needs Review</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
