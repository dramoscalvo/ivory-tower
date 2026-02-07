import type { Entity } from './Entity';
import type { Relationship } from './Relationship';
import type { UseCase } from '../../../usecase/domain/models/UseCase';

export interface UMLDiagram {
  title: string;
  entities: Entity[];
  relationships: Relationship[];
  useCases?: UseCase[];
}
