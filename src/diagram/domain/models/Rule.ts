export type RuleType = 'unique' | 'invariant' | 'validation' | 'constraint';

export interface Rule {
  id: string;
  entityRef: string;
  field?: string;
  type: RuleType;
  description: string;
}
