import { useRef } from 'react';
import { useExport } from './useExport';
import { ExportDropdown } from './ExportDropdown';
import { AddDropdown } from './AddDropdown';
import { ImportModal } from './ImportModal';
import { AddEntityModal } from './AddEntityModal';
import { AddRelationshipModal } from './AddRelationshipModal';
import { AddUseCaseModal } from './AddUseCaseModal';
import { AddEndpointModal } from './AddEndpointModal';
import type { ShareStatus } from '../../hooks/useUrlSharing';
import logoUrl from '/ivoryTower_1.png';
import styles from './Toolbar.module.css';

interface EntityOption {
  id: string;
  name: string;
  methods?: { name: string }[];
}

interface ActorOption {
  id: string;
  name: string;
}

interface UseCaseOption {
  id: string;
  name: string;
}

interface ToolbarProps {
  json: string;
  hasValidDiagram: boolean;
  onLoadExample: () => void;
  onShare: () => void;
  shareStatus: ShareStatus;
  onImport: (json: string) => void;
  onExportSvg: () => void;
  entities: EntityOption[];
  actors: ActorOption[];
  useCases: UseCaseOption[];
  onAddEntity: (entityJson: string) => void;
  onAddRelationship: (relationshipJson: string) => void;
  onAddUseCase: (useCaseJson: string) => void;
  onAddEndpoint: (endpointJson: string) => void;
}

export function Toolbar({
  json,
  hasValidDiagram,
  onLoadExample,
  onShare,
  shareStatus,
  onImport,
  onExportSvg,
  entities,
  actors,
  useCases,
  onAddEntity,
  onAddRelationship,
  onAddUseCase,
  onAddEndpoint,
}: ToolbarProps) {
  const { handleExport, handleExportJson, handleExportMermaid, canExport } = useExport(json, hasValidDiagram);
  const importRef = useRef<HTMLDialogElement>(null);
  const addEntityRef = useRef<HTMLDialogElement>(null);
  const addRelRef = useRef<HTMLDialogElement>(null);
  const addUcRef = useRef<HTMLDialogElement>(null);
  const addEpRef = useRef<HTMLDialogElement>(null);

  const shareLabel =
    shareStatus === 'copied' ? 'Copied!' : shareStatus === 'error' ? 'Error' : 'Share';

  return (
    <div className={styles.toolbar}>
      <div className={styles.title}>
        <img src={logoUrl} alt="" className={styles.logo} />
        Ivory Tower
      </div>
      <div className={styles.actions}>
        <AddDropdown
          entityCount={entities.length}
          onAddEntity={() => addEntityRef.current?.showModal()}
          onAddRelationship={() => addRelRef.current?.showModal()}
          onAddUseCase={() => addUcRef.current?.showModal()}
          onAddEndpoint={() => addEpRef.current?.showModal()}
        />
        <div className={styles.separator} />
        <button
          className={styles.button}
          onClick={() => importRef.current?.showModal()}
          type="button"
        >
          Import
        </button>
        <button className={styles.button} onClick={onLoadExample} type="button">
          Load Example
        </button>
        <button
          className={styles.button}
          onClick={onShare}
          disabled={!hasValidDiagram}
          type="button"
        >
          {shareLabel}
        </button>
        <div className={styles.separator} />
        <ExportDropdown
          canExport={canExport}
          onExportToon={handleExport}
          onExportJson={handleExportJson}
          onExportSvg={onExportSvg}
          onExportMermaid={handleExportMermaid}
        />
      </div>
      <ImportModal ref={importRef} onClose={() => importRef.current?.close()} onImport={onImport} />
      <AddEntityModal
        ref={addEntityRef}
        onClose={() => addEntityRef.current?.close()}
        onAdd={onAddEntity}
      />
      <AddRelationshipModal
        ref={addRelRef}
        entities={entities}
        onClose={() => addRelRef.current?.close()}
        onAdd={onAddRelationship}
      />
      <AddUseCaseModal
        ref={addUcRef}
        entities={entities}
        actors={actors}
        onClose={() => addUcRef.current?.close()}
        onAdd={onAddUseCase}
      />
      <AddEndpointModal
        ref={addEpRef}
        useCases={useCases}
        onClose={() => addEpRef.current?.close()}
        onAdd={onAddEndpoint}
      />
    </div>
  );
}
