import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useExport } from './useExport';
import { ExportDropdown } from './ExportDropdown';
import { AddDropdown } from './AddDropdown';
import { ImportModal } from './ImportModal';
import { AddActorModal } from './AddActorModal';
import { AddEntityModal } from './AddEntityModal';
import { AddRelationshipModal } from './AddRelationshipModal';
import { AddUseCaseModal } from './AddUseCaseModal';
import { AddEndpointModal } from './AddEndpointModal';
import { AddRuleModal } from './AddRuleModal';
import { ConfirmDialog } from './ConfirmDialog';
import type { ShareStatus } from '../../hooks/useUrlSharing';
import type { ImportResult } from './ImportModal';
import logoUrl from '/ivoryTower_1.png';
import styles from './Toolbar.module.css';

interface EntityOption {
  id: string;
  name: string;
  methods?: { name: string }[];
  functions?: { name: string }[];
  fieldNames: string[];
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
  onImport: (payload: ImportResult) => void;
  onExportSvg: () => void;
  entities: EntityOption[];
  actors: ActorOption[];
  useCases: UseCaseOption[];
  relationshipIds: string[];
  endpointIds: string[];
  ruleIds: string[];
  onAddEntity: (entityJson: string) => void;
  onAddActor: (actorJson: string) => void;
  onAddRelationship: (relationshipJson: string) => void;
  onAddUseCase: (useCaseJson: string) => void;
  onAddEndpoint: (endpointJson: string) => void;
  onAddRule: (ruleJson: string) => void;
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
  relationshipIds,
  endpointIds,
  ruleIds,
  onAddEntity,
  onAddActor,
  onAddRelationship,
  onAddUseCase,
  onAddEndpoint,
  onAddRule,
}: ToolbarProps) {
  const { t } = useTranslation();
  const { handleExport, handleExportJson, handleExportMermaid, canExport } = useExport(
    json,
    hasValidDiagram,
  );
  const importRef = useRef<HTMLDialogElement>(null);
  const addEntityRef = useRef<HTMLDialogElement>(null);
  const addActorRef = useRef<HTMLDialogElement>(null);
  const addRelRef = useRef<HTMLDialogElement>(null);
  const addUcRef = useRef<HTMLDialogElement>(null);
  const addEpRef = useRef<HTMLDialogElement>(null);
  const addRuleRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const shareLabel =
    shareStatus === 'copied'
      ? t('toolbar.shareCopied')
      : shareStatus === 'error'
        ? t('toolbar.shareError')
        : t('toolbar.share');

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
          onAddActor={() => addActorRef.current?.showModal()}
          onAddRelationship={() => addRelRef.current?.showModal()}
          onAddUseCase={() => addUcRef.current?.showModal()}
          onAddEndpoint={() => addEpRef.current?.showModal()}
          onAddRule={() => addRuleRef.current?.showModal()}
        />
        <div className={styles.separator} />
        <button
          className={styles.button}
          onClick={() => importRef.current?.showModal()}
          type="button"
        >
          {t('toolbar.import')}
        </button>
        <button
          className={styles.button}
          onClick={() => confirmRef.current?.showModal()}
          type="button"
        >
          {t('toolbar.loadExample')}
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
        existingEntityIds={entities.map(entity => entity.id)}
        onClose={() => addEntityRef.current?.close()}
        onAdd={onAddEntity}
      />
      <AddActorModal
        ref={addActorRef}
        existingActorIds={actors.map(actor => actor.id)}
        onClose={() => addActorRef.current?.close()}
        onAdd={onAddActor}
      />
      <AddRelationshipModal
        ref={addRelRef}
        entities={entities}
        existingRelationshipIds={relationshipIds}
        onClose={() => addRelRef.current?.close()}
        onAdd={onAddRelationship}
      />
      <AddUseCaseModal
        ref={addUcRef}
        entities={entities}
        actors={actors}
        existingUseCaseIds={useCases.map(useCase => useCase.id)}
        onClose={() => addUcRef.current?.close()}
        onAdd={onAddUseCase}
      />
      <AddEndpointModal
        ref={addEpRef}
        useCases={useCases}
        entities={entities}
        existingEndpointIds={endpointIds}
        onClose={() => addEpRef.current?.close()}
        onAdd={onAddEndpoint}
      />
      <AddRuleModal
        ref={addRuleRef}
        entities={entities}
        existingRuleIds={ruleIds}
        onClose={() => addRuleRef.current?.close()}
        onAdd={onAddRule}
      />
      <ConfirmDialog
        ref={confirmRef}
        title={t('toolbar.confirmLoadTitle')}
        message={t('toolbar.confirmLoadMessage')}
        onConfirm={onLoadExample}
        onClose={() => confirmRef.current?.close()}
      />
    </div>
  );
}
