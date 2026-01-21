import { useState, useCallback } from "react";

export interface LetterState {
  content: string;
  date: string;
  recipientTitle: string;
  recipientName: string;
  recipientOrganization: string;
  subject: string;
  signature?: string;
  closing?: string;
}

interface UseLetterHistoryOptions {
  maxHistorySize?: number;
}

interface UseLetterHistoryReturn {
  history: LetterState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  addState: (state: LetterState) => void;
  undo: () => LetterState | null;
  redo: () => LetterState | null;
  reset: () => void;
}

/**
 * Custom hook for managing letter history (undo/redo functionality)
 */
export function useLetterHistory(
  options: UseLetterHistoryOptions = {}
): UseLetterHistoryReturn {
  const { maxHistorySize = 5 } = options;
  const [history, setHistory] = useState<LetterState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addState = useCallback(
    (state: LetterState) => {
      setHistory((prev) => {
        // Remove any states after current index (when undoing and then making new changes)
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(state);
        // Keep only the last maxHistorySize states
        const trimmedHistory = newHistory.slice(-maxHistorySize);
        // Update index to point to the new state
        setHistoryIndex(trimmedHistory.length - 1);
        return trimmedHistory;
      });
    },
    [historyIndex, maxHistorySize]
  );

  const undo = useCallback((): LetterState | null => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setHistoryIndex(prevIndex);
      return prevState;
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback((): LetterState | null => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setHistoryIndex(nextIndex);
      return nextState;
    }
    return null;
  }, [history, historyIndex]);

  const reset = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    addState,
    undo,
    redo,
    reset,
  };
}
