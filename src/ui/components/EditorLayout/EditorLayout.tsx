import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Footer } from '../Footer';
import { TabPanel } from '../TabPanel';
import type { Tab } from '../TabPanel';
import styles from './EditorLayout.module.css';

const TABS: Tab[] = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'usecases', label: 'Use Cases' },
  { id: 'coverage', label: 'Coverage' },
];

interface EditorLayoutProps {
  toolbar: ReactNode;
  architectureEditor: ReactNode;
  useCasesEditor: ReactNode;
  canvas: ReactNode;
  useCasePanel: ReactNode;
  coveragePanel: ReactNode;
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

export function EditorLayout({
  toolbar,
  architectureEditor,
  useCasesEditor,
  canvas,
  useCasePanel,
  coveragePanel,
  activeTab,
  onTabChange,
}: EditorLayoutProps) {
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth);
  const [isResizing, setIsResizing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Document-level listeners for drag resize (genuine side-effect: global event listeners)
  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
      setEditorWidth(clampedWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      // Read current width via functional updater to avoid stale closure
      setEditorWidth(current => {
        localStorage.setItem(EDITOR_WIDTH_KEY, String(current));
        return current;
      });
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

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
            ) : activeTab === 'usecases' ? (
              useCasePanel
            ) : (
              coveragePanel
            )}
          </TabPanel>
        </section>
      </main>
      <Footer />
    </div>
  );
}
