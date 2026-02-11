import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { Compartment, EditorState } from '@codemirror/state';
import { Decoration, ViewPlugin, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { vim } from '@replit/codemirror-vim';
import type { Range } from '@codemirror/state';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
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
  vimMode?: boolean;
}

const ERROR_LINE_MARK = Decoration.line({ class: styles.errorLine });

function buildErrorDecorations(view: EditorView, lines: number[]) {
  const ranges: Range<Decoration>[] = [];
  const doc = view.state.doc;
  for (const lineNum of lines) {
    if (lineNum >= 1 && lineNum <= doc.lines) {
      const line = doc.line(lineNum);
      ranges.push(ERROR_LINE_MARK.range(line.from));
    }
  }
  return Decoration.set(ranges, true);
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { value, onUpdate, fontSize, highlightedLines, vimMode },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartment = useRef(new Compartment());
  const fontCompartment = useRef(new Compartment());
  const errorLinesRef = useRef<number[]>([]);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Store highlighted lines for the plugin to access
  errorLinesRef.current = highlightedLines ?? [];

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      const view = viewRef.current;
      if (!view) return;
      const doc = view.state.doc;
      if (line < 1 || line > doc.lines) return;
      const lineObj = doc.line(line);
      view.dispatch({
        effects: EditorView.scrollIntoView(lineObj.from, { y: 'center' }),
      });
      // Flash the line briefly
      const lineDOM = view.domAtPos(lineObj.from).node.parentElement;
      if (lineDOM) {
        lineDOM.classList.add(styles.flashLine);
        setTimeout(() => lineDOM.classList.remove(styles.flashLine), 1500);
      }
    },
    focus() {
      viewRef.current?.focus();
    },
  }));

  // Initialize CodeMirror (runs once)
  useEffect(() => {
    if (!containerRef.current) return;

    const highlightStyle = HighlightStyle.define([
      { tag: tags.propertyName, color: 'var(--azure)' },
      { tag: tags.string, color: 'var(--emerald)' },
      { tag: tags.number, color: 'var(--violet)' },
      { tag: tags.bool, color: 'var(--amber)' },
      { tag: tags.null, color: 'var(--gray)' },
      { tag: tags.punctuation, color: 'var(--silver)' },
      { tag: tags.separator, color: 'var(--silver)' },
    ]);

    const errorPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = buildErrorDecorations(view, errorLinesRef.current);
        }
        update(_update: ViewUpdate) {
          const view = _update.view;
          this.decorations = buildErrorDecorations(view, errorLinesRef.current);
        }
      },
      { decorations: (v) => v.decorations },
    );

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          vimCompartment.current.of(vimMode ? vim() : []),
          basicSetup,
          json(),
          EditorState.tabSize.of(2),
          syntaxHighlighting(highlightStyle),
          fontCompartment.current.of(
            EditorView.theme({
              '&': { fontSize },
              '.cm-content': { fontFamily: 'var(--font-mono)' },
              '.cm-gutters': { fontFamily: 'var(--font-mono)' },
            }),
          ),
          errorPlugin,
          keymap.of([
            {
              key: 'Tab',
              run: (view) => {
                view.dispatch(
                  view.state.update(view.state.replaceSelection('  '), {
                    scrollIntoView: true,
                    userEvent: 'input',
                  }),
                );
                return true;
              },
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onUpdateRef.current(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              background: 'var(--bg-input)',
              color: 'var(--text-code)',
            },
            '.cm-content': {
              caretColor: 'var(--text-primary)',
            },
            '.cm-cursor': {
              borderLeftColor: 'var(--text-primary)',
            },
            '&.cm-focused .cm-cursor': {
              borderLeftColor: 'var(--text-primary)',
            },
            '.cm-gutters': {
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              border: 'none',
            },
            '.cm-activeLineGutter': {
              background: 'transparent',
            },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
              background: 'rgba(74, 144, 217, 0.2) !important',
            },
            '.cm-matchingBracket': {
              outline: '1px solid var(--azure)',
              borderRadius: '2px',
              color: 'inherit',
              background: 'transparent',
            },
            '.cm-activeLine': {
              background: 'transparent',
            },
            '.cm-panels': {
              background: 'var(--bg-toolbar)',
              color: 'var(--text-primary)',
            },
            '.cm-panels input': {
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            },
            '.cm-panels button': {
              background: 'var(--bg-button)',
              color: 'var(--text-primary)',
              border: 'none',
            },
            '.cm-searchMatch': {
              background: 'rgba(74, 144, 217, 0.3)',
            },
            '.cm-searchMatch-selected': {
              background: 'rgba(74, 144, 217, 0.5)',
            },
            '.cm-fat-cursor': {
              background: 'rgba(74, 144, 217, 0.5) !important',
              color: 'var(--text-primary) !important',
            },
            '&:not(.cm-focused) .cm-fat-cursor': {
              outline: '1px solid rgba(74, 144, 217, 0.5)',
              background: 'transparent !important',
            },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init only
  }, []);

  // External value sync (undo/redo/load/prettify)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Vim toggle
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: vimCompartment.current.reconfigure(vimMode ? vim() : []),
    });
  }, [vimMode]);

  // Font size
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontCompartment.current.reconfigure(
        EditorView.theme({
          '&': { fontSize },
          '.cm-content': { fontFamily: 'var(--font-mono)' },
          '.cm-gutters': { fontFamily: 'var(--font-mono)' },
        }),
      ),
    });
  }, [fontSize]);

  // Error line decorations update — force plugin to re-evaluate
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    // Force the error plugin to re-evaluate by dispatching a no-op state effect
    view.dispatch();
  }, [highlightedLines]);

  return <div className={styles.container} ref={containerRef} />;
});
