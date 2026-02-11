export type RelationshipType =
  | 'inheritance'
  | 'implementation'
  | 'composition'
  | 'aggregation'
  | 'dependency'
  | 'association';

export type Cardinality = '1' | '0..1' | '1..*' | '*' | '0..*';

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  label?: string;
  sourceCardinality?: Cardinality;
  targetCardinality?: Cardinality;
}
