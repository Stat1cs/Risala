import { useEffect, useRef, useCallback } from "react";

type SyncState = "idle" | "editing" | "syncing";

interface UseContentEditableSyncOptions {
  content: string;
  onContentChange: (content: string) => void;
  enabled?: boolean;
}

interface UseContentEditableSyncReturn {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  handleContentChange: () => void;
  handleKeyDown: () => void;
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

/**
 * Custom hook for managing contentEditable synchronization
 * Handles the complex logic of syncing between React state and DOM contentEditable
 * Uses a state machine pattern to prevent race conditions
 */
export function useContentEditableSync({
  content,
  onContentChange,
  enabled = true,
}: UseContentEditableSyncOptions): UseContentEditableSyncReturn {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const syncStateRef = useRef<SyncState>("idle");
  const lastSyncedContentRef = useRef(content);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize contentEditable with initial content
  useEffect(() => {
    if (!enabled || !contentEditableRef.current || isInitializedRef.current) {
      return;
    }

    contentEditableRef.current.innerText = content || "";
    lastSyncedContentRef.current = content || "";
    isInitializedRef.current = true;
  }, [content, enabled]);

  // Update contentEditable when content prop changes (from AI generation)
  // Only update if content changed externally (not from user editing)
  useEffect(() => {
    if (!enabled) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    if (
      contentEditableRef.current &&
      syncStateRef.current !== "editing" &&
      isInitializedRef.current
    ) {
      const currentContent = contentEditableRef.current.innerText || "";

      // Only update if content prop changed and it's different from what we last synced
      if (content !== lastSyncedContentRef.current && content !== currentContent) {
        // Use setTimeout to ensure DOM is ready and avoid interfering with typing
        updateTimeoutRef.current = setTimeout(() => {
          if (contentEditableRef.current && syncStateRef.current !== "editing") {
            // Save cursor position as offset before update
            const selection = window.getSelection();
            let cursorOffset = 0;

            if (
              selection &&
              selection.rangeCount > 0 &&
              contentEditableRef.current.contains(selection.anchorNode)
            ) {
              try {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(contentEditableRef.current);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                cursorOffset = preCaretRange.toString().length;
              } catch {
                // If we can't calculate offset, use current content length
                cursorOffset = currentContent.length;
              }
            }

            // Update content
            contentEditableRef.current.innerText = content;
            lastSyncedContentRef.current = content;

            // Restore cursor position using offset
            if (selection && contentEditableRef.current.firstChild) {
              try {
                const textNode = contentEditableRef.current.firstChild;
                const maxOffset = textNode.textContent?.length || 0;
                const newRange = document.createRange();
                newRange.setStart(textNode, Math.min(cursorOffset, maxOffset));
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              } catch {
                // If restoration fails, place cursor at end
                try {
                  const endRange = document.createRange();
                  endRange.selectNodeContents(contentEditableRef.current);
                  endRange.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(endRange);
                } catch {
                  // Ignore errors
                }
              }
            }
          }
        }, 0);
      }
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [content, enabled]);

  const handleContentChange = useCallback(() => {
    if (!contentEditableRef.current) return;

    // Set state to editing immediately to prevent React from interfering
    syncStateRef.current = "editing";
    const newContent = contentEditableRef.current.innerText || "";
    lastSyncedContentRef.current = newContent;
    onContentChange(newContent);

    // Reset editing state after a delay to allow AI updates
    setTimeout(() => {
      syncStateRef.current = "idle";
    }, 1000);
  }, [onContentChange]);

  const handleKeyDown = useCallback(() => {
    // Set editing flag immediately on key press
    syncStateRef.current = "editing";
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      syncStateRef.current = "editing";

      const text = e.clipboardData.getData("text/plain");
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // Trigger content change
        if (contentEditableRef.current) {
          const newContent = contentEditableRef.current.innerText || "";
          lastSyncedContentRef.current = newContent;
          onContentChange(newContent);
        }
      }

      setTimeout(() => {
        syncStateRef.current = "idle";
      }, 1000);
    },
    [onContentChange]
  );

  return {
    contentEditableRef,
    handleContentChange,
    handleKeyDown,
    handlePaste,
  };
}
