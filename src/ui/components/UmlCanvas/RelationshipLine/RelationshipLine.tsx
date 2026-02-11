import type { RelationshipLayout } from '../../../../diagram/domain/services/LayoutCalculator';
import type { RelationshipType } from '../../../../diagram/domain/models/Relationship';
import styles from './RelationshipLine.module.css';

interface RelationshipLineProps {
  layout: RelationshipLayout;
  labelPosition?: { x: number; y: number };
  dimmed?: boolean;
}

function getMarkerEnd(type: RelationshipType): string {
  switch (type) {
    case 'inheritance':
    case 'implementation':
      return 'url(#arrow-hollow)';
    case 'composition':
      return 'url(#diamond-filled)';
    case 'aggregation':
      return 'url(#diamond-hollow)';
    case 'dependency':
    case 'association':
      return 'url(#arrow-open)';
  }
}

function getLineStyle(type: RelationshipType): string {
  switch (type) {
    case 'implementation':
    case 'dependency':
      return styles.dashed;
    default:
      return styles.solid;
  }
}

const CARDINALITY_OFFSET = 14;

function getCardinalityPosition(
  point: { x: number; y: number; side: string },
  offset: number,
): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  switch (point.side) {
    case 'top':
      return { x: point.x + offset, y: point.y - 6, anchor: 'start' };
    case 'bottom':
      return { x: point.x + offset, y: point.y + 16, anchor: 'start' };
    case 'left':
      return { x: point.x - 6, y: point.y - offset, anchor: 'end' };
    case 'right':
      return { x: point.x + 6, y: point.y - offset, anchor: 'start' };
    default:
      return { x: point.x + offset, y: point.y - 6, anchor: 'start' };
  }
}

export function RelationshipLine({ layout, labelPosition, dimmed }: RelationshipLineProps) {
  const { relationship, source, target } = layout;
  const markerEnd = getMarkerEnd(relationship.type);
  const lineStyle = getLineStyle(relationship.type);

  // Calculate control points for a curved path
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  // Offset based on direction
  let controlX = midX;
  let controlY = midY;

  if (source.side === 'top' || source.side === 'bottom') {
    controlX = source.x;
    controlY = midY;
  } else {
    controlX = midX;
    controlY = source.y;
  }

  const path = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;

  const labelX = labelPosition?.x ?? midX;
  const labelY = labelPosition?.y ?? midY - 8;

  const srcCard = relationship.sourceCardinality
    ? getCardinalityPosition(source, CARDINALITY_OFFSET)
    : null;
  const tgtCard = relationship.targetCardinality
    ? getCardinalityPosition(target, CARDINALITY_OFFSET)
    : null;

  return (
    <g className={`${styles.relationship} ${dimmed ? styles.dimmed : ''}`}>
      <path d={path} className={`${styles.line} ${lineStyle}`} markerEnd={markerEnd} />
      {relationship.label && (
        <text x={labelX} y={labelY} className={styles.label}>
          {relationship.label}
        </text>
      )}
      {srcCard && (
        <text
          x={srcCard.x}
          y={srcCard.y}
          className={styles.cardinality}
          textAnchor={srcCard.anchor}
        >
          {relationship.sourceCardinality}
        </text>
      )}
      {tgtCard && (
        <text
          x={tgtCard.x}
          y={tgtCard.y}
          className={styles.cardinality}
          textAnchor={tgtCard.anchor}
        >
          {relationship.targetCardinality}
        </text>
      )}
    </g>
  );
}
