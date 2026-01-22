"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Type, Bold, Italic, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
}

export function FormattingToolbar({ contentEditableRef }: FormattingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Check if selection is within our contentEditable
      if (
        !contentEditableRef.current ||
        !contentEditableRef.current.contains(range.commonAncestorContainer)
      ) {
        setIsVisible(false);
        return;
      }

      // Get selection position
      const rect = range.getBoundingClientRect();
      const containerRect = contentEditableRef.current.getBoundingClientRect();
      
      // Position toolbar above selection, centered
      setPosition({
        top: rect.top - containerRect.top - 50, // 50px above selection
        left: rect.left - containerRect.left + rect.width / 2, // Centered on selection
      });
      
      setIsVisible(true);
    };

    // Listen for selection changes
    document.addEventListener("selectionchange", handleSelectionChange);
    
    // Also listen for mouseup to catch selections
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, [contentEditableRef]);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Trigger input event to update content
    if (contentEditableRef.current) {
      const event = new Event("input", { bubbles: true });
      contentEditableRef.current.dispatchEvent(event);
    }
    // Keep selection to allow multiple formatting operations
    setIsVisible(true);
  };

  const applyFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Wrap selection in span with font size
    const span = document.createElement("span");
    span.style.fontSize = size;
    
    try {
      range.surroundContents(span);
    } catch {
      // If surroundContents fails, extract content and wrap it
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }

    // Trigger input event
    if (contentEditableRef.current) {
      const event = new Event("input", { bubbles: true });
      contentEditableRef.current.dispatchEvent(event);
    }
    setIsVisible(true);
  };

  const fontSizeOptions = [
    { label: "10pt", value: "10pt" },
    { label: "12pt", value: "12pt" },
    { label: "14pt", value: "14pt" },
    { label: "16pt", value: "16pt" },
    { label: "18pt", value: "18pt" },
    { label: "20pt", value: "20pt" },
    { label: "24pt", value: "24pt" },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "absolute z-50 flex items-center gap-1",
        "bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg p-1",
        "pointer-events-auto"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)", // Center the toolbar
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
    >
      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            aria-label="Font size"
          >
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {fontSizeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => applyFontSize(option.value)}
            >
              <span style={{ fontSize: option.value }}>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bold */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8"
        onClick={() => applyFormat("bold")}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8"
        onClick={() => applyFormat("italic")}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Underline */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8"
        onClick={() => applyFormat("underline")}
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
    </div>
  );
}
