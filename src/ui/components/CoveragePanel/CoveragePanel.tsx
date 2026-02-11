import type { UMLDiagram } from '../../../diagram/domain/models/UMLDiagram';
import type { CompletenessWarning } from '../../../diagram/domain/services/CompletenessValidator';
import styles from './CoveragePanel.module.css';

interface EntityCoverage {
  entityId: string;
  entityName: string;
  useCaseCount: number;
  endpointCount: number;
  ruleCount: number;
  hasRelationships: boolean;
}

interface CoveragePanelProps {
  diagram: UMLDiagram | null;
  warnings: CompletenessWarning[];
}

function computeCoverage(diagram: UMLDiagram): EntityCoverage[] {
  const useCases = diagram.useCases ?? [];
  const endpoints = diagram.endpoints ?? [];
  const rules = diagram.rules ?? [];

  const connectedEntities = new Set<string>();
  for (const rel of diagram.relationships) {
    connectedEntities.add(rel.sourceId);
    connectedEntities.add(rel.targetId);
  }

  // Build endpoint-to-usecase-to-entity mapping
  const useCaseEntityMap = new Map<string, string>();
  for (const uc of useCases) {
    useCaseEntityMap.set(uc.id, uc.entityRef);
  }

  return diagram.entities.map(entity => {
    const ucCount = useCases.filter(uc => uc.entityRef === entity.id).length;

    // Endpoints that reference this entity via requestBody, response, or useCaseRef
    const epCount = endpoints.filter(ep => {
      if (ep.requestBody?.entityRef === entity.id) return true;
      if (ep.response?.entityRef === entity.id) return true;
      if (ep.useCaseRef && useCaseEntityMap.get(ep.useCaseRef) === entity.id) return true;
      return false;
    }).length;

    const ruleCount = rules.filter(r => r.entityRef === entity.id).length;

    return {
      entityId: entity.id,
      entityName: entity.name,
      useCaseCount: ucCount,
      endpointCount: epCount,
      ruleCount: ruleCount,
      hasRelationships: connectedEntities.has(entity.id),
    };
  });
}

function getCoverageLevel(coverage: EntityCoverage): 'full' | 'partial' | 'none' {
  const checks = [
    coverage.useCaseCount > 0,
    coverage.endpointCount > 0,
    coverage.hasRelationships,
  ];
  const passed = checks.filter(Boolean).length;
  if (passed === checks.length) return 'full';
  if (passed > 0) return 'partial';
  return 'none';
}

const CATEGORY_LABELS: Record<string, string> = {
  'uncovered-entity': 'No Use Cases',
  'unreferenced-method': 'Unreferenced Method',
  'usecase-no-endpoint': 'No Endpoint',
  'endpoint-no-usecase': 'No Use Case',
  'orphan-entity': 'No Relationships',
};

export function CoveragePanel({ diagram, warnings }: CoveragePanelProps) {
  if (!diagram || diagram.entities.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No entities to analyze</p>
          <p className={styles.emptyDescription}>
            Add entities to your diagram to see coverage analysis.
          </p>
        </div>
      </div>
    );
  }

  const coverages = computeCoverage(diagram);
  const fullCount = coverages.filter(c => getCoverageLevel(c) === 'full').length;
  const percentage = Math.round((fullCount / coverages.length) * 100);

  return (
    <div className={styles.panel}>
      <div className={styles.summary}>
        <div className={styles.percentage}>
          <span className={styles.percentageValue}>{percentage}%</span>
          <span className={styles.percentageLabel}>fully covered</span>
        </div>
        <div className={styles.counts}>
          <span className={styles.countFull}>{fullCount} full</span>
          <span className={styles.countPartial}>
            {coverages.filter(c => getCoverageLevel(c) === 'partial').length} partial
          </span>
          <span className={styles.countNone}>
            {coverages.filter(c => getCoverageLevel(c) === 'none').length} none
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Entity Coverage</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Entity</th>
              <th className={styles.thCenter}>Use Cases</th>
              <th className={styles.thCenter}>Endpoints</th>
              <th className={styles.thCenter}>Rules</th>
              <th className={styles.thCenter}>Relations</th>
            </tr>
          </thead>
          <tbody>
            {coverages.map(coverage => {
              const level = getCoverageLevel(coverage);
              return (
                <tr key={coverage.entityId} className={styles[level]}>
                  <td className={styles.entityName}>{coverage.entityName}</td>
                  <td className={styles.tdCenter}>{coverage.useCaseCount}</td>
                  <td className={styles.tdCenter}>{coverage.endpointCount}</td>
                  <td className={styles.tdCenter}>{coverage.ruleCount}</td>
                  <td className={styles.tdCenter}>{coverage.hasRelationships ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Warnings ({warnings.length})
          </h3>
          <ul className={styles.warningList}>
            {warnings.map((w, i) => (
              <li key={i} className={styles.warningItem}>
                <span className={styles.warningBadge}>
                  {CATEGORY_LABELS[w.category] ?? w.category}
                </span>
                <span className={styles.warningMessage}>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
