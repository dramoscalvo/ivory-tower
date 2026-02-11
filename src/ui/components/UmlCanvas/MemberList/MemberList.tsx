import type {
  Attribute,
  Method,
  Function as Fn,
  TypeDefinition,
  Visibility,
} from '../../../../diagram/domain/models/Entity';
import styles from './MemberList.module.css';

interface MemberListProps {
  values?: string[];
  attributes?: Attribute[];
  methods?: Method[];
  functions?: Fn[];
  types?: TypeDefinition[];
  startY: number;
  width: number;
}

const MEMBER_HEIGHT = 24;
const PADDING = 12;

function visibilitySymbol(visibility?: Visibility): string {
  switch (visibility) {
    case 'private':
      return '-';
    case 'protected':
      return '#';
    case 'public':
    default:
      return '+';
  }
}

function formatType(type: { name: string; generics?: { name: string }[] }): string {
  if (type.generics && type.generics.length > 0) {
    return `${type.name}<${type.generics.map(g => g.name).join(', ')}>`;
  }
  return type.name;
}

export function MemberList({
  values,
  attributes,
  methods,
  functions,
  types,
  startY,
  width,
}: MemberListProps) {
  const items: React.ReactNode[] = [];
  let y = startY;

  if (values && values.length > 0) {
    items.push(
      <line key="values-sep" x1={0} y1={y} x2={width} y2={y} className={styles.separator} />,
    );
    y += 4;

    for (const value of values) {
      items.push(
        <text key={`value-${value}`} x={PADDING} y={y + 16} className={styles.member}>
          {value}
        </text>,
      );
      y += MEMBER_HEIGHT;
    }
  }

  if (attributes && attributes.length > 0) {
    items.push(
      <line key="attr-sep" x1={0} y1={y} x2={width} y2={y} className={styles.separator} />,
    );
    y += 4;

    for (const attr of attributes) {
      const text = `${visibilitySymbol(attr.visibility)} ${attr.name}: ${formatType(attr.type)}`;
      items.push(
        <text key={`attr-${attr.name}`} x={PADDING} y={y + 16} className={styles.member}>
          {text}
        </text>,
      );
      y += MEMBER_HEIGHT;
    }
  }

  if (methods && methods.length > 0) {
    items.push(
      <line key="method-sep" x1={0} y1={y} x2={width} y2={y} className={styles.separator} />,
    );
    y += 4;

    for (const method of methods) {
      const params = method.parameters.map(p => `${p.name}: ${formatType(p.type)}`).join(', ');
      const text = `${visibilitySymbol(method.visibility)} ${method.name}(${params}): ${formatType(method.returnType)}`;
      items.push(
        <text key={`method-${method.name}`} x={PADDING} y={y + 16} className={styles.member}>
          {text}
        </text>,
      );
      y += MEMBER_HEIGHT;
    }
  }

  if (functions && functions.length > 0) {
    items.push(<line key="fn-sep" x1={0} y1={y} x2={width} y2={y} className={styles.separator} />);
    y += 4;

    for (const fn of functions) {
      const params = fn.parameters.map(p => `${p.name}: ${formatType(p.type)}`).join(', ');
      const vis = fn.isExported ? '+' : '-';
      const text = `${vis} ${fn.name}(${params}): ${formatType(fn.returnType)}`;
      items.push(
        <text key={`fn-${fn.name}`} x={PADDING} y={y + 16} className={styles.member}>
          {text}
        </text>,
      );
      y += MEMBER_HEIGHT;
    }
  }

  if (types && types.length > 0) {
    items.push(
      <line key="type-sep" x1={0} y1={y} x2={width} y2={y} className={styles.separator} />,
    );
    y += 4;

    for (const t of types) {
      const vis = t.isExported ? '+' : '-';
      const text = `${vis} type ${t.name}`;
      items.push(
        <text key={`type-${t.name}`} x={PADDING} y={y + 16} className={styles.member}>
          {text}
        </text>,
      );
      y += MEMBER_HEIGHT;
    }
  }

  return <g>{items}</g>;
}
