import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onPrettify: () => void;
  onExport: () => void;
  onFitToView: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Skip if focus is inside a code editor (let editor handle its own undo/redo)
      const active = document.activeElement;
      const inEditor = active?.closest('.cm-editor') !== null;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onFitToView();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        handlers.onPrettify();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handlers.onExport();
        return;
      }

      if (inEditor) return;

      if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handlers.onRedo();
        return;
      }

      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handlers.onRedo();
        return;
      }

      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handlers.onUndo();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handlers]);
}
