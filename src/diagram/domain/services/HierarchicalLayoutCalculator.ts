import type { UMLDiagram } from '../models/UMLDiagram';
import type { DiagramLayout, EntityLayout, RelationshipLayout } from './LayoutCalculator';
import { calculateEntitySize, findConnectionPoints, ENTITY_MARGIN } from './layoutUtils';

const TITLE_HEIGHT = 40;
const GRID_COLUMNS = 3;
const HIERARCHY_TYPES = new Set(['inheritance', 'implementation']);

export function calculateHierarchicalLayout(diagram: UMLDiagram): DiagramLayout {
  const entitySizes = new Map<string, { width: number; height: number }>();
  for (const entity of diagram.entities) {
    entitySizes.set(entity.id, calculateEntitySize(entity));
  }

  // Build adjacency for hierarchy: parent → children
  // For inheritance/implementation: source inherits/implements target, so target is parent
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const entityIds = new Set(diagram.entities.map(e => e.id));

  for (const rel of diagram.relationships) {
    if (!HIERARCHY_TYPES.has(rel.type)) continue;
    if (!entityIds.has(rel.sourceId) || !entityIds.has(rel.targetId)) continue;

    // target is parent, source is child
    if (!children.has(rel.targetId)) children.set(rel.targetId, []);
    children.get(rel.targetId)!.push(rel.sourceId);

    if (!parents.has(rel.sourceId)) parents.set(rel.sourceId, []);
    parents.get(rel.sourceId)!.push(rel.targetId);
  }

  // Assign levels using longest-path from roots
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function assignLevel(id: string): number {
    if (levels.has(id)) return levels.get(id)!;
    if (inStack.has(id)) {
      // Cycle detected, break it
      levels.set(id, 0);
      return 0;
    }

    inStack.add(id);
    visited.add(id);

    const parentIds = parents.get(id) ?? [];
    let maxParentLevel = -1;
    for (const parentId of parentIds) {
      maxParentLevel = Math.max(maxParentLevel, assignLevel(parentId));
    }

    const level = maxParentLevel + 1;
    levels.set(id, level);
    inStack.delete(id);
    return level;
  }

  // Find connected entities (those with hierarchy relationships)
  const connectedIds = new Set<string>();
  for (const rel of diagram.relationships) {
    if (HIERARCHY_TYPES.has(rel.type)) {
      connectedIds.add(rel.sourceId);
      connectedIds.add(rel.targetId);
    }
  }

  // Assign levels to all connected entities
  for (const id of connectedIds) {
    if (!visited.has(id)) {
      assignLevel(id);
    }
  }

  // Collect disconnected entities
  const disconnected = diagram.entities.filter(e => !connectedIds.has(e.id));

  // Group connected entities by level
  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(id);
  }

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  // Barycenter heuristic for crossing minimization (2 passes)
  for (let pass = 0; pass < 4; pass++) {
    const isTopDown = pass % 2 === 0;
    const levelsToProcess = isTopDown ? sortedLevels : [...sortedLevels].reverse();

    for (let i = 1; i < levelsToProcess.length; i++) {
      const level = levelsToProcess[i];
      const prevLevel = levelsToProcess[i - 1];
      const prevEntities = levelGroups.get(prevLevel)!;
      const currentEntities = levelGroups.get(level)!;

      // Calculate barycenter for each entity in current level
      const barycenters = new Map<string, number>();
      for (const entityId of currentEntities) {
        const connectedInPrev: number[] = [];
        const relatedIds = isTopDown ? (parents.get(entityId) ?? []) : (children.get(entityId) ?? []);
        for (const relId of relatedIds) {
          const idx = prevEntities.indexOf(relId);
          if (idx !== -1) connectedInPrev.push(idx);
        }
        if (connectedInPrev.length > 0) {
          barycenters.set(entityId, connectedInPrev.reduce((a, b) => a + b, 0) / connectedInPrev.length);
        } else {
          barycenters.set(entityId, currentEntities.indexOf(entityId));
        }
      }

      // Sort by barycenter
      currentEntities.sort((a, b) => (barycenters.get(a) ?? 0) - (barycenters.get(b) ?? 0));
      levelGroups.set(level, currentEntities);
    }
  }

  // Position entities
  const entityLayouts: EntityLayout[] = [];
  const entityLayoutMap = new Map<string, EntityLayout>();
  const entityMap = new Map(diagram.entities.map(e => [e.id, e]));

  // Find widest level for centering
  const levelWidths = new Map<number, number>();
  for (const [level, ids] of levelGroups) {
    let width = 0;
    for (const id of ids) {
      const size = entitySizes.get(id)!;
      width += size.width + ENTITY_MARGIN;
    }
    width -= ENTITY_MARGIN; // Remove trailing margin
    levelWidths.set(level, Math.max(width, 0));
  }

  const maxLevelWidth = Math.max(...levelWidths.values(), 0);

  let currentY = ENTITY_MARGIN + TITLE_HEIGHT;

  for (const level of sortedLevels) {
    const ids = levelGroups.get(level)!;
    const levelWidth = levelWidths.get(level)!;
    let currentX = ENTITY_MARGIN + (maxLevelWidth - levelWidth) / 2;
    let rowMaxHeight = 0;

    for (const id of ids) {
      const entity = entityMap.get(id)!;
      const size = entitySizes.get(id)!;

      const layout: EntityLayout = {
        entity,
        position: { x: currentX, y: currentY },
        size,
      };
      entityLayouts.push(layout);
      entityLayoutMap.set(id, layout);

      currentX += size.width + ENTITY_MARGIN;
      rowMaxHeight = Math.max(rowMaxHeight, size.height);
    }

    currentY += rowMaxHeight + ENTITY_MARGIN;
  }

  // Grid layout for disconnected entities below
  if (disconnected.length > 0) {
    currentY += ENTITY_MARGIN;
    let gridX = ENTITY_MARGIN;
    let rowMaxHeight = 0;
    let columnCount = 0;

    for (const entity of disconnected) {
      const size = entitySizes.get(entity.id)!;

      if (columnCount >= GRID_COLUMNS) {
        gridX = ENTITY_MARGIN;
        currentY += rowMaxHeight + ENTITY_MARGIN;
        rowMaxHeight = 0;
        columnCount = 0;
      }

      const layout: EntityLayout = {
        entity,
        position: { x: gridX, y: currentY },
        size,
      };
      entityLayouts.push(layout);
      entityLayoutMap.set(entity.id, layout);

      gridX += size.width + ENTITY_MARGIN;
      rowMaxHeight = Math.max(rowMaxHeight, size.height);
      columnCount++;
    }

    currentY += rowMaxHeight;
  }

  // Calculate relationships
  const relationshipLayouts: RelationshipLayout[] = [];
  for (const relationship of diagram.relationships) {
    const sourceLayout = entityLayoutMap.get(relationship.sourceId);
    const targetLayout = entityLayoutMap.get(relationship.targetId);
    if (sourceLayout && targetLayout) {
      const { source, target } = findConnectionPoints(sourceLayout, targetLayout);
      relationshipLayouts.push({ relationship, source, target });
    }
  }

  // Calculate bounds
  let maxX = 0;
  let maxY = 0;
  for (const layout of entityLayouts) {
    maxX = Math.max(maxX, layout.position.x + layout.size.width + ENTITY_MARGIN);
    maxY = Math.max(maxY, layout.position.y + layout.size.height + ENTITY_MARGIN);
  }
  maxX = Math.max(maxX, maxLevelWidth + ENTITY_MARGIN * 2);

  return {
    diagram,
    entities: entityLayouts,
    relationships: relationshipLayouts,
    bounds: { width: maxX, height: maxY },
    titlePosition: { x: maxX / 2, y: ENTITY_MARGIN + TITLE_HEIGHT / 2 },
  };
}
