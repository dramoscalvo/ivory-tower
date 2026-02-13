import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../Footer/Footer';
import { TabPanel } from '../TabPanel/TabPanel';
import type { Tab } from '../TabPanel/TabPanel';
import type { Theme } from '../../hooks/useTheme';
import styles from './EditorLayout.module.css';

interface EditorLayoutProps {
  toolbar: ReactNode;
  architectureEditor: ReactNode;
  useCasesEditor: ReactNode;
  canvas: ReactNode;
  useCasePanel: ReactNode;
  coveragePanel: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}: EditorLayoutProps) {
  const { t } = useTranslation();
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth);
  const [isResizing, setIsResizing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const tabs: Tab[] = [
    { id: 'architecture', label: t('tabs.architecture') },
    { id: 'usecases', label: t('tabs.useCases') },
    { id: 'coverage', label: t('tabs.coverage') },
  ];

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
        style={{ gridTemplateColumns: `${editorWidth}% 0.25rem 1fr` }}
      >
        <section className={styles.editor}>
          {activeTab === 'architecture' ? architectureEditor : useCasesEditor}
        </section>
        <div
          className={`${styles.divider} ${isResizing ? styles.dividerActive : ''}`}
          onMouseDown={handleResizeStart}
        />
        <section className={styles.rightPane}>
          <TabPanel tabs={tabs} activeTab={activeTab} onTabChange={onTabChange}>
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
      <Footer theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}
