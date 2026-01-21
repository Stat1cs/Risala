"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { formatFileSize as formatFileSizeUtil } from "@/lib/utils/file";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, AudioLines, ArrowUp, X, Upload, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string, fileIds?: string[]) => void;
  isLoading?: boolean;
  uiLanguage?: "ar" | "en";
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  fileId?: string; // OpenAI file ID
  type: string;
}

// Upload limits
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total

export function ChatInput({ disabled, onSend, isLoading, uiLanguage = "ar" }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea function
  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      const maxHeight = 200; // Maximum height in pixels (approximately 12-13 lines)
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = 
        textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, []);

  // Auto-resize textarea on message change
  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  // Handle input event for real-time resizing while typing
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    resizeTextarea();
  }, [resizeTextarea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || uploadedFiles.length > 0) && !disabled && !isLoading) {
      const fileIds = uploadedFiles.filter(f => f.fileId).map(f => f.fileId!);
      onSend(message.trim(), fileIds.length > 0 ? fileIds : undefined);
      setMessage("");
      setUploadedFiles([]);
      // Reset textarea height after clearing message
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        // Trigger resize to ensure it resets to minimum height
        setTimeout(() => resizeTextarea(), 0);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Calculate current total size
    const currentTotalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const filesToAdd: File[] = [];

    // Validate files before adding
    for (const file of Array.from(files)) {
      // Check file count limit
      if (uploadedFiles.length + filesToAdd.length >= MAX_FILES) {
        alert(uiLanguage === "ar" 
          ? `تم الوصول إلى الحد الأقصى لعدد الملفات (${MAX_FILES} ملفات)`
          : `Maximum file limit reached (${MAX_FILES} files)`);
        break;
      }

      // Validate individual file size (50 MB for PDFs, 25 MB for audio)
      const maxSize = file.type.startsWith("audio/") ? 25 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(uiLanguage === "ar" 
          ? `الملف ${file.name} كبير جداً. الحد الأقصى: ${maxSize / (1024 * 1024)} MB`
          : `File ${file.name} is too large. Maximum: ${maxSize / (1024 * 1024)} MB`);
        continue;
      }

      // Check total size limit
      if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        alert(uiLanguage === "ar" 
          ? `الحد الأقصى للحجم الإجمالي (${MAX_TOTAL_SIZE / (1024 * 1024)} MB) تم تجاوزه`
          : `Maximum total size limit (${MAX_TOTAL_SIZE / (1024 * 1024)} MB) exceeded`);
        continue;
      }

      filesToAdd.push(file);
    }

    // Add all valid files at once
    const newFiles: UploadedFile[] = filesToAdd.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to OpenAI
    for (let i = 0; i < filesToAdd.length; i++) {
      const file = filesToAdd[i];
      const newFile = newFiles[i];

      // Upload to OpenAI
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", file.type.startsWith("audio/") ? "assistants" : "user_data");

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        setUploadedFiles(prev => 
          prev.map(f => f.id === newFile.id ? { ...f, fileId: data.fileId } : f)
        );
      } catch (error) {
        console.error("File upload error:", error);
        setUploadedFiles(prev => prev.filter(f => f.id !== newFile.id));
        alert(uiLanguage === "ar" 
          ? `فشل تحميل الملف ${file.name}`
          : `Failed to upload ${file.name}`);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(uiLanguage === "ar" 
        ? "فشل الوصول إلى الميكروفون. يرجى التحقق من الأذونات."
        : "Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      setMessage(prev => prev + (prev ? " " : "") + data.text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert(uiLanguage === "ar" 
        ? "فشل تحويل الصوت إلى نص"
        : "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatFileSize = formatFileSizeUtil;

  const isRTL = uiLanguage === "ar";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl px-4 py-4 pointer-events-auto">
        {/* File previews and upload limit info */}
        <div className="mb-2 space-y-2" dir={isRTL ? "rtl" : "ltr"}>
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <Upload className="h-3 w-3 shrink-0" />
                <span className="max-w-[200px] truncate">{file.name}</span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatFileSize(file.size)}
                </span>
                {file.fileId && (
                  <span className="text-xs text-green-600 dark:text-green-400 shrink-0">✓</span>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="hover:bg-destructive/10 rounded p-0.5 shrink-0"
                  aria-label={uiLanguage === "ar" ? "إزالة الملف" : "Remove file"}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              ))}
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="text-xs text-muted-foreground px-1">
              {uiLanguage === "ar" 
                ? `${uploadedFiles.length}/${MAX_FILES} ملفات - ${formatFileSize(uploadedFiles.reduce((sum, f) => sum + f.size, 0))} / ${formatFileSize(MAX_TOTAL_SIZE)}`
                : `${uploadedFiles.length}/${MAX_FILES} files - ${formatFileSize(uploadedFiles.reduce((sum, f) => sum + f.size, 0))} / ${formatFileSize(MAX_TOTAL_SIZE)}`}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Field orientation="vertical">
            <FieldLabel htmlFor="prompt" className="sr-only">
              {uiLanguage === "ar" ? "الرسالة" : "Prompt"}
            </FieldLabel>
            <div className="relative">
              <InputGroup 
                className="bg-background/90 backdrop-blur-md border border-border/60 shadow-xl rounded-2xl" 
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { flexDirection: "row-reverse" } : {}}
              >
                {/* Attachment button - Right side in RTL, Left side in LTR */}
                <InputGroupAddon 
                  align="inline-start"
                  style={isRTL ? { order: 3 } : { order: 1 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled || isLoading}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">{uiLanguage === "ar" ? "إضافة مرفق" : "Add attachment"}</span>
                      </InputGroupButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align={isRTL ? "end" : "start"}
                      side="top"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      onEscapeKeyDown={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement;
                        if (target === fileInputRef.current || fileInputRef.current?.contains(target)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          requestAnimationFrame(() => {
                            fileInputRef.current?.click();
                          });
                        }}
                      >
                        <Upload className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {uiLanguage === "ar" ? "رفع ملف" : "Upload file"}
                        {uploadedFiles.length > 0 && (
                          <span className={cn("text-xs text-muted-foreground", isRTL ? "mr-auto" : "ml-auto")}>
                            ({uploadedFiles.length}/{MAX_FILES})
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        {uiLanguage === "ar" ? "إضافة قالب" : "Add template"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </InputGroupAddon>
                
                {/* Textarea - Middle */}
                <InputGroupTextarea
                  ref={textareaRef}
                  id="prompt"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    disabled
                      ? (uiLanguage === "ar" ? "الدفع مطلوب لبدء كتابة الرسالة" : "Payment required to begin drafting your letter")
                      : (uiLanguage === "ar" ? "اكتب تفاصيل الرسالة هنا، مع توضيح الغرض والسياق وأي معلومات ذات صلة" : "Write the details of the letter here and any relevant information")
                  }
                  disabled={disabled || isLoading}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={{ 
                    order: 2,
                    textAlign: isRTL ? "right" : "left",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
                  }}
                  className={cn(
                    "min-h-10 max-h-[200px] field-sizing-content",
                    "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
                    "hover:scrollbar-thumb-muted-foreground/30",
                    "dark:scrollbar-thumb-muted-foreground/30 dark:hover:scrollbar-thumb-muted-foreground/40",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  rows={1}
                />
                
                {/* Voice and Send buttons - Left side in RTL, Right side in LTR */}
                <InputGroupAddon 
                  align="inline-end"
                  style={isRTL ? { order: 1 } : { order: 3 }}
                >
                  <div className={cn("flex items-center gap-0", isRTL ? "flex-row-reverse" : "")}>
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled || isLoading || isTranscribing}
                      onClick={handleVoiceClick}
                      className={cn(
                        isRecording && "bg-destructive/10 text-destructive animate-pulse"
                      )}
                      title={uiLanguage === "ar" ? "إدخال صوتي" : "Voice input"}
                    >
                      {isTranscribing ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : isRecording ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <AudioLines className="h-4 w-4" />
                      )}
                      <span className="sr-only">{uiLanguage === "ar" ? "إدخال صوتي" : "Voice input"}</span>
                    </InputGroupButton>
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="icon-sm"
                      disabled={disabled || isLoading || (!message.trim() && uploadedFiles.length === 0)}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">{uiLanguage === "ar" ? "إرسال" : "Send message"}</span>
                    </InputGroupButton>
                  </div>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </Field>
        </form>
      </div>
    </div>
  );
}
