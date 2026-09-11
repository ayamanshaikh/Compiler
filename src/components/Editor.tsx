"use client";

import { useRef, useCallback } from "react";
import Monaco from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  errorLine?: number | null;
  activeLine?: number | null;
  readOnly?: boolean;
}

export default function Editor({
  code,
  onChange,
  errorLine = null,
  activeLine = null,
  readOnly = false,
}: EditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Dark theme matching our design
      monaco.editor.defineTheme("codevista-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280", fontStyle: "italic" },
          { token: "keyword", foreground: "c084fc" },
          { token: "string", foreground: "34d399" },
          { token: "number", foreground: "fbbf24" },
          { token: "type", foreground: "60a5fa" },
          { token: "delimiter", foreground: "9ca3af" },
          { token: "operator", foreground: "f87171" },
          { token: "variable", foreground: "e4e4e7" },
          { token: "identifier", foreground: "e4e4e7" },
        ],
        colors: {
          "editor.background": "#080b12",
          "editor.foreground": "#e4e4e7",
          "editor.lineHighlightBackground": "#3b82f60a",
          "editor.lineHighlightBorder": "#3b82f614",
          "editor.selectionBackground": "#3b82f625",
          "editorCursor.foreground": "#60a5fa",
          "editorLineNumber.foreground": "#52525b",
          "editorLineNumber.activeForeground": "#a1a1aa",
          "editorIndentGuide.background": "#1f1f2e",
          "editorIndentGuide.activeBackground": "#3f3f5e",
          "editorBracketMatch.background": "#3b82f620",
          "editorBracketMatch.border": "#3b82f640",
          "editorGutter.background": "#080b12",
          "editorWidget.background": "#111827",
          "editorWidget.border": "#ffffff14",
          "input.background": "#0d111a",
          "input.border": "#ffffff14",
          "dropdown.background": "#111827",
          "scrollbar.shadow": "#00000000",
          "scrollbarSlider.background": "#ffffff1a",
          "scrollbarSlider.hoverBackground": "#ffffff2e",
          "scrollbarSlider.activeBackground": "#ffffff33",
        },
      });
      monaco.editor.setTheme("codevista-dark");

      // Configure Java language
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      // Ctrl+Enter runs the code
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          // Dispatch a custom event that the workspace page listens for
          window.dispatchEvent(new CustomEvent("codevista-run"));
        }
      );

      // Ctrl+S saves (prevents browser default)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          // No-op: just prevent browser save dialog
        }
      );

      // Focus editor
      editor.focus();
    },
    []
  );

  // Update decorations when errorLine or activeLine changes
  const updateDecorations = useCallback(
    (editor: Parameters<OnMount>[0]) => {
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;

      const newDecorations: Parameters<Parameters<OnMount>[0]["createDecorationsCollection"]>[0] = [];

      if (errorLine && errorLine > 0 && errorLine <= model.getLineCount()) {
        newDecorations.push({
          range: {
            startLineNumber: errorLine,
            startColumn: 1,
            endLineNumber: errorLine,
            endColumn: model.getLineMaxColumn(errorLine),
          },
          options: {
            isWholeLine: true,
            className: "cv-error-line",
            glyphMarginClassName: "cv-error-glyph",
            glyphMarginHoverMessage: { value: "**Compilation Error** on this line" },
          },
        });
      }

      if (activeLine && activeLine > 0 && activeLine <= model.getLineCount()) {
        newDecorations.push({
          range: {
            startLineNumber: activeLine,
            startColumn: 1,
            endLineNumber: activeLine,
            endColumn: model.getLineMaxColumn(activeLine),
          },
          options: {
            isWholeLine: true,
            className: "cv-active-line",
          },
        });
      }

      editor.createDecorationsCollection(newDecorations);
    },
    [errorLine, activeLine]
  );

  // React to line changes
  const handleEditorMountWrapped: OnMount = useCallback(
    (editor, monaco) => {
      handleEditorMount(editor, monaco);

      // Set up decoration update on content change
      editor.onDidChangeCursorPosition(() => {
        updateDecorations(editor);
      });
    },
    [handleEditorMount, updateDecorations]
  );

  // Update decorations when props change
  const handleEditorMountFinal: OnMount = useCallback(
    (editor, monaco) => {
      handleEditorMountWrapped(editor, monaco);
      // Initial decoration update
      setTimeout(() => updateDecorations(editor), 100);
    },
    [handleEditorMountWrapped, updateDecorations]
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080b12]">
      {/* CSS for Monaco decoration classes */}
      <style jsx global>{`
        .cv-error-line {
          background: rgba(239, 68, 68, 0.08) !important;
          border-left: 3px solid #ef4444 !important;
        }
        .cv-error-glyph {
          background: #ef4444;
          border-radius: 2px;
          margin-left: 4px;
        }
        .cv-active-line {
          background: rgba(59, 130, 246, 0.06) !important;
          border-left: 2px solid #3b82f6 !important;
        }
        .margin-view-overlays {
          background: #080b12 !important;
        }
        .minimap {
          opacity: 0.6;
        }
      `}</style>

      <Monaco
        height="100%"
        defaultLanguage="java"
        theme="codevista-dark"
        value={code}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorMountFinal}
        options={{
          fontSize: 13,
          fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 22,
          padding: { top: 16, bottom: 16 },
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          tabSize: 4,
          insertSpaces: true,
          wordWrap: "off",
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlightOnlyWhenFocus: false,
          folding: true,
          links: false,
          contextmenu: true,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
