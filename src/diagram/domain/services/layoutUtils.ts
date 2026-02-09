import type { Entity } from '../models/Entity';
import type { ConnectionPoint, EntityLayout, Size } from './LayoutCalculator';

export const ENTITY_PADDING = 16;
export const ENTITY_HEADER_HEIGHT = 32;
export const MEMBER_HEIGHT = 24;
export const CHAR_WIDTH = 8;
export const MIN_ENTITY_WIDTH = 120;
export const ENTITY_MARGIN = 60;

export function calculateEntitySize(entity: Entity): Size {
  const members = [
    ...(entity.attributes ?? []),
    ...(entity.methods ?? []),
    ...(entity.functions ?? []),
    ...(entity.types ?? []),
  ];

  const memberCount = members.length;
  const height = ENTITY_HEADER_HEIGHT + memberCount * MEMBER_HEIGHT + ENTITY_PADDING;

  let maxTextWidth = entity.name.length * CHAR_WIDTH;
  if (entity.generics && entity.generics.length > 0) {
    maxTextWidth += (entity.generics.join(', ').length + 2) * CHAR_WIDTH;
  }

  for (const attr of entity.attributes ?? []) {
    const attrText = `${attr.visibility ? attr.visibility[0] + ' ' : ''}${attr.name}: ${attr.type.name}`;
    maxTextWidth = Math.max(maxTextWidth, attrText.length * CHAR_WIDTH);
  }

  for (const method of entity.methods ?? []) {
    const params = method.parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');
    const methodText = `${method.visibility ? method.visibility[0] + ' ' : ''}${method.name}(${params}): ${method.returnType.name}`;
    maxTextWidth = Math.max(maxTextWidth, methodText.length * CHAR_WIDTH);
  }

  for (const fn of entity.functions ?? []) {
    const params = fn.parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');
    const fnText = `${fn.isExported ? '+ ' : '- '}${fn.name}(${params}): ${fn.returnType.name}`;
    maxTextWidth = Math.max(maxTextWidth, fnText.length * CHAR_WIDTH);
  }

  const width = Math.max(MIN_ENTITY_WIDTH, maxTextWidth + ENTITY_PADDING * 2);

  return { width, height };
}

export function findConnectionPoints(
  sourceLayout: EntityLayout,
  targetLayout: EntityLayout
): { source: ConnectionPoint; target: ConnectionPoint } {
  const sourceCenter = {
    x: sourceLayout.position.x + sourceLayout.size.width / 2,
    y: sourceLayout.position.y + sourceLayout.size.height / 2,
  };
  const targetCenter = {
    x: targetLayout.position.x + targetLayout.size.width / 2,
    y: targetLayout.position.y + targetLayout.size.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  let sourceSide: ConnectionPoint['side'];
  let targetSide: ConnectionPoint['side'];

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      sourceSide = 'right';
      targetSide = 'left';
    } else {
      sourceSide = 'left';
      targetSide = 'right';
    }
  } else {
    if (dy > 0) {
      sourceSide = 'bottom';
      targetSide = 'top';
    } else {
      sourceSide = 'top';
      targetSide = 'bottom';
    }
  }

  const getPoint = (layout: EntityLayout, side: ConnectionPoint['side']): ConnectionPoint => {
    const { position, size } = layout;
    switch (side) {
      case 'top':
        return { x: position.x + size.width / 2, y: position.y, side };
      case 'bottom':
        return { x: position.x + size.width / 2, y: position.y + size.height, side };
      case 'left':
        return { x: position.x, y: position.y + size.height / 2, side };
      case 'right':
        return { x: position.x + size.width, y: position.y + size.height / 2, side };
    }
  };

  return {
    source: getPoint(sourceLayout, sourceSide),
    target: getPoint(targetLayout, targetSide),
  };
}
