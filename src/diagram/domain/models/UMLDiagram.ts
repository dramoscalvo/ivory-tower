import type { Entity } from './Entity';
import type { Relationship } from './Relationship';
import type { Project } from './Project';
import type { Actor } from './Actor';
import type { Endpoint } from './Endpoint';
import type { Rule } from './Rule';
import type { UseCase } from '../../../usecase/domain/models/UseCase';

export interface UMLDiagram {
  title: string;
  project?: Project;
  actors?: Actor[];
  entities: Entity[];
  relationships: Relationship[];
  endpoints?: Endpoint[];
  rules?: Rule[];
  useCases?: UseCase[];
}
