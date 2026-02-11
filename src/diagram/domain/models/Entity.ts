export type EntityType = 'class' | 'interface' | 'module' | 'type' | 'abstract-class' | 'enum';

export type Visibility = 'public' | 'private' | 'protected';

export interface TypeRef {
  name: string;
  generics?: TypeRef[];
}

export interface Attribute {
  name: string;
  type: TypeRef;
  visibility?: Visibility;
}

export interface Parameter {
  name: string;
  type: TypeRef;
}

export interface Method {
  name: string;
  parameters: Parameter[];
  returnType: TypeRef;
  visibility?: Visibility;
  isStatic?: boolean;
  isAbstract?: boolean;
}

export interface Function {
  name: string;
  parameters: Parameter[];
  returnType: TypeRef;
  isExported?: boolean;
}

export interface TypeDefinition {
  name: string;
  definition: string;
  isExported?: boolean;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  generics?: string[];
  attributes?: Attribute[];
  methods?: Method[];
  functions?: Function[];
  types?: TypeDefinition[];
  values?: string[];
}
