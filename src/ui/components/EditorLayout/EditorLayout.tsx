import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Footer } from '../Footer';
import { TabPanel } from '../TabPanel';
import type { Tab } from '../TabPanel';
import styles from './EditorLayout.module.css';

const TABS: Tab[] = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'usecases', label: 'Use Cases' },
];

interface EditorLayoutProps {
  toolbar: ReactNode;
  architectureEditor: ReactNode;
  useCasesEditor: ReactNode;
  canvas: ReactNode;
  useCasePanel: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const MIN_PANEL_WIDTH = 15; // percentage
const MAX_PANEL_WIDTH = 85; // percentage
const EDITOR_WIDTH_KEY = 'editor-width';

function loadEditorWidth(): number {
  const stored = localStorage.getItem(EDITOR_WIDTH_KEY);
  if (stored === null) return 50;
  const value = parseFloat(stored);
  if (isNaN(value) || value < MIN_PANEL_WIDTH || value > MAX_PANEL_WIDTH) return 50;
  return value;
}

export function EditorLayout({ toolbar, architectureEditor, useCasesEditor, canvas, useCasePanel, activeTab, onTabChange }: EditorLayoutProps) {
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth);
  const [isResizing, setIsResizing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !mainRef.current) return;

      const rect = mainRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
      setEditorWidth(clampedWidth);
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const prevIsResizing = useRef(false);
  useEffect(() => {
    if (prevIsResizing.current && !isResizing) {
      localStorage.setItem(EDITOR_WIDTH_KEY, String(editorWidth));
    }
    prevIsResizing.current = isResizing;
  }, [isResizing, editorWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div className={styles.layout}>
      <header className={styles.toolbar}>{toolbar}</header>
      <main
        ref={mainRef}
        className={styles.main}
        style={{ gridTemplateColumns: `${editorWidth}% 4px 1fr` }}
      >
        <section className={styles.editor}>
          {activeTab === 'architecture' ? architectureEditor : useCasesEditor}
        </section>
        <div
          className={`${styles.divider} ${isResizing ? styles.dividerActive : ''}`}
          onMouseDown={handleResizeStart}
        />
        <section className={styles.rightPane}>
          <TabPanel tabs={TABS} activeTab={activeTab} onTabChange={onTabChange}>
            {activeTab === 'architecture' ? (
              <div className={styles.canvas}>{canvas}</div>
            ) : (
              useCasePanel
            )}
          </TabPanel>
        </section>
      </main>
      <Footer />
    </div>
  );
}
