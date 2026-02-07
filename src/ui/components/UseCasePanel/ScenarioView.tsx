import type { Scenario } from '../../../usecase/domain/models/UseCase';
import styles from './UseCasePanel.module.css';

interface ScenarioViewProps {
  scenario: Scenario;
}

export function ScenarioView({ scenario }: ScenarioViewProps) {
  return (
    <div className={styles.scenario}>
      <h4 className={styles.scenarioName}>{scenario.name}</h4>
      <ul className={styles.stepList}>
        {scenario.steps.map((step, index) => (
          <li key={index} className={styles.step}>
            <span className={styles[`keyword${step.keyword}`]}>{step.keyword}</span>
            <span className={styles.stepText}>{step.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
