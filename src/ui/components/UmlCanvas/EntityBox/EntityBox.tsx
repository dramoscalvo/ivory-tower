import type { EntityLayout } from '../../../../diagram/domain/services/LayoutCalculator';
import { MemberList } from '../MemberList/MemberList';
import styles from './EntityBox.module.css';

interface EntityBoxProps {
  layout: EntityLayout;
}

const HEADER_HEIGHT = 32;

function getTypeLabel(type: string): string {
  switch (type) {
    case 'interface':
      return '<<interface>>';
    case 'abstract-class':
      return '<<abstract>>';
    case 'module':
      return '<<module>>';
    case 'type':
      return '<<type>>';
    default:
      return '';
  }
}

export function EntityBox({ layout }: EntityBoxProps) {
  const { entity, position, size } = layout;
  const typeLabel = getTypeLabel(entity.type);
  const genericsText = entity.generics?.length ? `<${entity.generics.join(', ')}>` : '';

  const typeStyles: Record<string, string> = {
    class: styles.classType,
    interface: styles.interfaceType,
    module: styles.moduleType,
    type: styles.typeType,
    'abstract-class': styles.abstractType,
  };

  const boxStyle = typeStyles[entity.type] || styles.classType;

  return (
    <g transform={`translate(${position.x}, ${position.y})`} className={styles.box}>
      <rect
        className={`${styles.background} ${boxStyle}`}
        width={size.width}
        height={size.height}
        rx={entity.type === 'type' ? 8 : 0}
      />

      {typeLabel && (
        <text x={size.width / 2} y={12} className={styles.stereotype}>
          {typeLabel}
        </text>
      )}

      <text
        x={size.width / 2}
        y={typeLabel ? 26 : 20}
        className={`${styles.header} ${entity.type === 'abstract-class' ? styles.italic : ''}`}
      >
        {entity.name}
        {genericsText}
      </text>

      <MemberList
        attributes={entity.attributes}
        methods={entity.methods}
        functions={entity.functions}
        types={entity.types}
        startY={HEADER_HEIGHT}
        width={size.width}
      />
    </g>
  );
}
