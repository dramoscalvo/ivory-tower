import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { DiagramLayout } from '../../../diagram/domain/services/LayoutCalculator';
import { computeLabelPositions } from '../../../diagram/domain/services/labelPlacement';
import { SvgDefs } from './SvgDefs';
import { EntityBox } from './EntityBox/EntityBox';
import { RelationshipLine } from './RelationshipLine/RelationshipLine';
import styles from './UmlCanvas.module.css';

export interface UmlCanvasHandle {
  fitToView(): void;
  getSvgElement(): SVGSVGElement | null;
}

interface UmlCanvasProps {
  layout: DiagramLayout | null;
  onEntityClick?: (entityId: string) => void;
}

interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
}

export const UmlCanvas = forwardRef<UmlCanvasHandle, UmlCanvasProps>(function UmlCanvas(
  { layout, onEntityClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  const labelPositions = layout ? computeLabelPositions(layout.relationships) : new Map();

  // Compute connected entities for hover highlighting
  const connectedEntityIds = new Set<string>();
  const connectedRelIds = new Set<string>();
  if (hoveredEntityId && layout) {
    connectedEntityIds.add(hoveredEntityId);
    for (const rel of layout.relationships) {
      const r = rel.relationship;
      if (r.sourceId === hoveredEntityId || r.targetId === hoveredEntityId) {
        connectedEntityIds.add(r.sourceId);
        connectedEntityIds.add(r.targetId);
        connectedRelIds.add(r.id);
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setView(prev => ({
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
      setView(prev => ({
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

  const zoomToEntity = (entityId: string) => {
    if (!layout || !containerRef.current) return;

    const entityLayout = layout.entities.find(e => e.entity.id === entityId);
    if (!entityLayout) return;

    const container = containerRef.current;
    const scale = 1;
    const centerX = entityLayout.position.x + entityLayout.size.width / 2;
    const centerY = entityLayout.position.y + entityLayout.size.height / 2;
    const translateX = container.clientWidth / 2 - centerX * scale;
    const translateY = container.clientHeight / 2 - centerY * scale;

    setView({ scale, translateX, translateY });
    setHighlightedEntityId(entityId);
    setSearchOpen(false);
    setSearchQuery('');

    // Clear highlight after animation
    setTimeout(() => setHighlightedEntityId(null), 2000);
  };

  const searchResults = layout && searchQuery.trim()
    ? layout.entities.filter(e =>
        e.entity.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  useImperativeHandle(ref, () => ({
    fitToView,
    getSvgElement: () => svgRef.current,
  }));

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
        ref={svgRef}
        className={styles.svg}
        width="100%"
        height="100%"
        style={{
          transform: `translate(${view.translateX}px, ${view.translateY}px) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <SvgDefs />

        {layout.titlePosition && (
          <text x={layout.titlePosition.x} y={layout.titlePosition.y} className={styles.title}>
            {layout.diagram.title}
          </text>
        )}

        {layout.relationships.map(rel => (
          <RelationshipLine
            key={rel.relationship.id}
            layout={rel}
            labelPosition={labelPositions.get(rel.relationship.id)}
            dimmed={hoveredEntityId !== null && !connectedRelIds.has(rel.relationship.id)}
          />
        ))}

        {layout.entities.map(entityLayout => (
          <EntityBox
            key={entityLayout.entity.id}
            layout={entityLayout}
            onClick={onEntityClick}
            onHover={setHoveredEntityId}
            dimmed={hoveredEntityId !== null && !connectedEntityIds.has(entityLayout.entity.id)}
          />
        ))}

        {highlightedEntityId && (() => {
          const el = layout.entities.find(e => e.entity.id === highlightedEntityId);
          if (!el) return null;
          return (
            <rect
              x={el.position.x - 4}
              y={el.position.y - 4}
              width={el.size.width + 8}
              height={el.size.height + 8}
              rx={4}
              className={styles.highlight}
            />
          );
        })()}
      </svg>

      {searchOpen && (
        <div className={styles.searchOverlay}>
          <input
            ref={searchRef}
            className={styles.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
              } else if (e.key === 'Enter' && searchResults.length > 0) {
                zoomToEntity(searchResults[0].entity.id);
              }
            }}
            placeholder="Search entities..."
            autoFocus
          />
          {searchResults.length > 0 && (
            <ul className={styles.searchResults}>
              {searchResults.map(el => (
                <li key={el.entity.id}>
                  <button
                    className={styles.searchResult}
                    onClick={() => zoomToEntity(el.entity.id)}
                    type="button"
                  >
                    {el.entity.name}
                    <span className={styles.searchResultType}>{el.entity.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => {
            setSearchOpen(prev => !prev);
            if (!searchOpen) setTimeout(() => searchRef.current?.focus(), 0);
          }}
          title="Search entities"
          aria-label="Search entities"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
        <button
          className={styles.controlButton}
          onClick={() => setView(v => ({ ...v, scale: Math.min(v.scale * 1.2, 5) }))}
          title="Zoom In"
          type="button"
        >
          +
        </button>
        <button
          className={styles.controlButton}
          onClick={() => setView(v => ({ ...v, scale: Math.max(v.scale * 0.8, 0.1) }))}
          title="Zoom Out"
          type="button"
        >
          -
        </button>
        <button className={styles.controlButton} onClick={fitToView} title="Fit to View" type="button">
          ⊡
        </button>
      </div>
    </div>
  );
});
