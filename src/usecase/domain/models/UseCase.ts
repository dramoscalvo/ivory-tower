export type GherkinKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

export interface GherkinStep {
  keyword: GherkinKeyword;
  text: string;
}

export interface Scenario {
  name: string;
  steps: GherkinStep[];
}

export interface UseCase {
  id: string;
  name: string;
  description?: string;
  entityRef: string;
  methodRef?: string;
  actorRef?: string;
  preconditions?: string[];
  postconditions?: string[];
  scenarios: Scenario[];
}
