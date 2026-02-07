import type { ReactNode } from 'react';
import styles from './TabPanel.module.css';

export interface Tab {
  id: string;
  label: string;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export function TabPanel({ tabs, activeTab, onTabChange, children }: TabPanelProps) {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.tabBar} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent} role="tabpanel">
        {children}
      </div>
    </div>
  );
}
