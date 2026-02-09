import { useState, useRef } from 'react';

interface UseHistoryOptions {
  debounceMs?: number;
  maxSize?: number;
}

export function useHistory(initialValue: string, options: UseHistoryOptions = {}) {
  const { debounceMs = 500, maxSize = 100 } = options;

  const [value, setValue] = useState(initialValue);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastSnapshot = useRef(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFlags = () => {
    setCanUndo(past.current.length > 0 || timerRef.current !== null);
    setCanRedo(future.current.length > 0);
  };

  const commitSnapshot = () => {
    if (lastSnapshot.current !== past.current[past.current.length - 1]) {
      past.current.push(lastSnapshot.current);
      if (past.current.length > maxSize) {
        past.current.shift();
      }
    }
  };

  const set = (newValue: string, immediate?: boolean) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (immediate) {
      commitSnapshot();
      lastSnapshot.current = newValue;
      future.current = [];
      setValue(newValue);
      updateFlags();
    } else {
      setValue(newValue);
      future.current = [];
      timerRef.current = setTimeout(() => {
        commitSnapshot();
        lastSnapshot.current = newValue;
        timerRef.current = null;
        updateFlags();
      }, debounceMs);
      updateFlags();
    }
  };

  const undo = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      future.current.push(lastSnapshot.current);
      setValue(lastSnapshot.current);
      updateFlags();
      return;
    }

    if (past.current.length === 0) return;

    const previous = past.current.pop()!;
    future.current.push(lastSnapshot.current);
    lastSnapshot.current = previous;
    setValue(previous);
    updateFlags();
  };

  const redo = () => {
    if (future.current.length === 0) return;

    const next = future.current.pop()!;
    past.current.push(lastSnapshot.current);
    if (past.current.length > maxSize) {
      past.current.shift();
    }
    lastSnapshot.current = next;
    setValue(next);
    updateFlags();
  };

  return { value, setValue: set, undo, redo, canUndo, canRedo };
}
