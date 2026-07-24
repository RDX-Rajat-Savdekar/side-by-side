export interface Commit {
  step: number;
  title: string;
  code: string;
  architect_notes: string;
  pivot_question: string;
  mermaid?: string; // Optional Mermaid diagram syntax
}

export interface SummaryRow {
  principle: string;
  violation: string;
  fix: string;
}

export interface Lesson {
  id: string;
  subject?: string;
  chapter?: string;
  title: string;
  language?: string;
  commits: Commit[];
  summary?: SummaryRow[];
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  chapters: Chapter[];
}

export type DiffViewMode = 'split' | 'unified' | 'single';

export interface QuizState {
  revealed: boolean;
  userRating?: 'easy' | 'hard';
}
