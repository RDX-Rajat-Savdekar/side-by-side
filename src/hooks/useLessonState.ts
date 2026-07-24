import { useState, useMemo, useCallback } from 'react';
import { Subject, Lesson, DiffViewMode } from '../types/lesson';
import { SEED_DATA } from '../data/seedData';
import { useLocalStorage } from './useLocalStorage';

export function useLessonState() {
  const [customLessons, setCustomLessons] = useLocalStorage<Lesson[]>('codeEvolution_custom', []);
  const [completedLessonIds, setCompletedLessonIds] = useLocalStorage<string[]>('codeEvolution_completed', []);
  const [visitedStepKeys, setVisitedStepKeys] = useLocalStorage<string[]>('codeEvolution_visited', []);
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('split');
  const [commentaryOpen, setCommentaryOpen] = useState<boolean>(true);
  const [commentaryWidth, setCommentaryWidth] = useState<number>(380);
  const [navOpen, setNavOpen] = useState<boolean>(true);
  const [navWidth, setNavWidth] = useState<number>(280);

  // Combine seed data and custom lessons into subjects hierarchy
  const subjects = useMemo(() => {
    const clonedSubjects: Subject[] = JSON.parse(JSON.stringify(SEED_DATA.subjects));

    customLessons.forEach(lesson => {
      const subjectName = lesson.subject || 'Low-Level Design';
      const chapterName = lesson.chapter || 'General';

      let subject = clonedSubjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
      if (!subject) {
        subject = {
          id: slugify(subjectName),
          name: subjectName,
          icon: getSubjectIcon(subjectName),
          chapters: []
        };
        clonedSubjects.push(subject);
      }

      let chapter = subject.chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
      if (!chapter) {
        chapter = { id: slugify(chapterName), name: chapterName, lessons: [] };
        subject.chapters.push(chapter);
      }

      if (!chapter.lessons.some(l => l.title === lesson.title || l.id === lesson.id)) {
        chapter.lessons.push(lesson);
      }
    });

    return clonedSubjects;
  }, [customLessons]);

  // Set default lesson on load if none selected
  useMemo(() => {
    if (!currentLesson && subjects.length > 0) {
      for (const sub of subjects) {
        for (const chap of sub.chapters) {
          if (chap.lessons.length > 0) {
            setCurrentLesson(chap.lessons[0]);
            setCurrentStep(0);
            return;
          }
        }
      }
    }
  }, [subjects, currentLesson]);

  // Select lesson
  const selectLesson = useCallback((lesson: Lesson, stepIndex = 0) => {
    setCurrentLesson(lesson);
    setCurrentStep(stepIndex);
    const key = `${lesson.id || lesson.title}-${stepIndex}`;
    setVisitedStepKeys(prev => prev.includes(key) ? prev : [...prev, key]);
  }, [setVisitedStepKeys]);

  // Navigate commit step
  const navigateStep = useCallback((newStep: number) => {
    if (!currentLesson) return;
    const maxStep = currentLesson.commits.length - 1;
    const clamped = Math.max(0, Math.min(newStep, maxStep));
    setCurrentStep(clamped);

    const key = `${currentLesson.id || currentLesson.title}-${clamped}`;
    setVisitedStepKeys(prev => prev.includes(key) ? prev : [...prev, key]);

    // Check if reached last step to auto-mark as complete
    if (clamped === maxStep) {
      const lessonId = currentLesson.id || currentLesson.title;
      setCompletedLessonIds(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
    }
  }, [currentLesson, setVisitedStepKeys, setCompletedLessonIds]);

  // Add custom imported lesson
  const addCustomLesson = useCallback((lesson: Lesson) => {
    if (!lesson.id) lesson.id = slugify(lesson.title);
    setCustomLessons(prev => {
      const filtered = prev.filter(l => l.id !== lesson.id && l.title !== lesson.title);
      return [...filtered, lesson];
    });
    selectLesson(lesson, 0);
  }, [setCustomLessons, selectLesson]);

  // Delete custom lesson
  const deleteCustomLesson = useCallback((lessonId: string) => {
    setCustomLessons(prev => prev.filter(l => (l.id || slugify(l.title)) !== lessonId));
  }, [setCustomLessons]);

  // Export all custom lessons
  const exportAllCustomLessons = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customLessons, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `code_evolution_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [customLessons]);

  return {
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
    visitedStepKeys: new Set(visitedStepKeys),
    completedLessonIds: new Set(completedLessonIds),
    selectLesson,
    navigateStep,
    addCustomLesson,
    deleteCustomLesson,
    exportAllCustomLessons,
    customLessonsCount: customLessons.length,
  };
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getSubjectIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('low') && n.includes('level')) return '🏗️';
  if (n.includes('high') && n.includes('level')) return '🌐';
  if (n.includes('leet') || n.includes('algorithm')) return '💻';
  if (n.includes('leader')) return '🎯';
  return '📚';
}
