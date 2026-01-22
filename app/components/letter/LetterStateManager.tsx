/**
 * Letter state management hook
 * Handles all letter state updates and history
 */

import { useCallback } from "react";
import { useLetterHistory } from "../../hooks/useLetterHistory";
import { useLetterState } from "../../hooks/useLetterState";
import type { LetterState } from "@/lib/types/letter";

export function useLetterStateManager() {
  const letterState = useLetterState();
  const history = useLetterHistory({ maxHistorySize: 5 });

  const updateFromHistory = useCallback(
    (state: LetterState | null) => {
      if (!state) return;
      
      letterState.setContent(state.content);
      letterState.setDate(state.date);
      letterState.setRecipientTitle(state.recipientTitle);
      letterState.setRecipientName(state.recipientName);
      letterState.setRecipientOrganization(state.recipientOrganization);
      letterState.setSubject(state.subject);
      if (state.language) {
        letterState.setLanguage(state.language);
      }
      if (state.signature !== undefined) {
        letterState.setSignature(state.signature);
      }
      if (state.closing !== undefined) {
        letterState.setClosing(state.closing);
      }
    },
    [letterState]
  );

  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    updateFromHistory(prevState);
  }, [history, updateFromHistory]);

  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    updateFromHistory(nextState);
  }, [history, updateFromHistory]);

  const addToHistory = useCallback(() => {
    history.addState(letterState.getState());
  }, [history, letterState]);

  return {
    letterState,
    history,
    handleUndo,
    handleRedo,
    addToHistory,
    updateFromHistory,
    resetHistory: history.reset,
  };
}
