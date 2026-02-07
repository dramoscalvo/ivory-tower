import { useState, useRef, useEffect } from 'react';
import type { DiagramLayout } from '../../../diagram/domain/services/LayoutCalculator';
import { SvgDefs } from './SvgDefs';
import { EntityBox } from './EntityBox/EntityBox';
import { RelationshipLine } from './RelationshipLine/RelationshipLine';
import styles from './UmlCanvas.module.css';

interface UmlCanvasProps {
  layout: DiagramLayout | null;
}

interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
}

export function UmlCanvas({ layout }: UmlCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setView((prev) => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * delta, 0.1), 5),
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.translateX, y: e.clientY - view.translateY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setView((prev) => ({
        ...prev,
        translateX: e.clientX - panStart.x,
        translateY: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const fitToView = () => {
    if (!layout || !containerRef.current) return;

    const container = containerRef.current;
    const padding = 40;
    const availableWidth = container.clientWidth - padding * 2;
    const availableHeight = container.clientHeight - padding * 2;

    const scaleX = availableWidth / layout.bounds.width;
    const scaleY = availableHeight / layout.bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const translateX = (container.clientWidth - layout.bounds.width * scale) / 2;
    const translateY = (container.clientHeight - layout.bounds.height * scale) / 2;

    setView({ scale, translateX, translateY });
  };

  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  if (!layout) {
    return (
      <div className={styles.container} ref={containerRef}>
        <div className={styles.empty}>Enter valid JSON to see the diagram</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isPanning ? styles.panning : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className={styles.svg}
        width="100%"
        height="100%"
        style={{
          transform: `translate(${view.translateX}px, ${view.translateY}px) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <SvgDefs />

        {layout.relationships.map((rel) => (
          <RelationshipLine key={rel.relationship.id} layout={rel} />
        ))}

        {layout.entities.map((entityLayout) => (
          <EntityBox key={entityLayout.entity.id} layout={entityLayout} />
        ))}
      </svg>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => setView((v) => ({ ...v, scale: Math.min(v.scale * 1.2, 5) }))}
          title="Zoom In"
        >
          +
        </button>
        <button
          className={styles.controlButton}
          onClick={() => setView((v) => ({ ...v, scale: Math.max(v.scale * 0.8, 0.1) }))}
          title="Zoom Out"
        >
          -
        </button>
        <button className={styles.controlButton} onClick={fitToView} title="Fit to View">
          ⊡
        </button>
      </div>
    </div>
  );
}
