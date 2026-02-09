import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Editor } from 'prism-react-editor';
import { BasicSetup } from 'prism-react-editor/setups';
import 'prism-react-editor/languages/json';
import 'prism-react-editor/layout.css';
import 'prism-react-editor/scrollbar.css';
import 'prism-react-editor/search.css';
import type { PrismEditor } from 'prism-react-editor';
import styles from './CodeEditor.module.css';

export interface CodeEditorHandle {
  scrollToLine(line: number): void;
  focus(): void;
}

interface CodeEditorProps {
  value: string;
  onUpdate: (value: string) => void;
  fontSize: string;
  highlightedLines?: number[];
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor({ value, onUpdate, fontSize, highlightedLines }, ref) {
    const editorRef = useRef<PrismEditor>(null);

    useImperativeHandle(ref, () => ({
      scrollToLine(line: number) {
        const editor = editorRef.current;
        if (!editor?.lines) return;
        // lines[0] is the overlay container, lines[1] is line 1, etc.
        const lineElement = editor.lines[line];
        if (lineElement) {
          lineElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          lineElement.classList.add(styles.flashLine);
          setTimeout(() => lineElement.classList.remove(styles.flashLine), 1500);
        }
      },
      focus() {
        editorRef.current?.textarea?.focus();
      },
    }));

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor?.lines) return;
      const lineCount = editor.lines.length;
      // Clear all error highlights
      for (let i = 1; i < lineCount; i++) {
        editor.lines[i].classList.remove(styles.errorLine);
      }
      // Apply new error highlights
      if (highlightedLines) {
        for (const line of highlightedLines) {
          if (line >= 1 && line < lineCount) {
            editor.lines[line].classList.add(styles.errorLine);
          }
        }
      }
    }, [highlightedLines, value]);

    return (
      <div className={styles.container} style={{ fontSize }}>
        <Editor
          ref={editorRef}
          language="json"
          value={value}
          onUpdate={onUpdate}
          lineNumbers={true}
          tabSize={2}
          insertSpaces={true}
          className={styles.editor}
        >
          <BasicSetup />
        </Editor>
      </div>
    );
  }
);
