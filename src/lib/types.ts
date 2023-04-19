import {
  FieldMap,
  FieldRef,
  NullableToOptional,
  SchemaTypes,
} from '@pothos/core';
import {ElastigraphFieldBuilder} from "./field-builder";
import {MappingProperty} from "@elastic/elasticsearch/lib/api/types";

export type OutputShapeFromFields<Fields extends FieldMap> =
  NullableToOptional<{
    [K in keyof Fields]: Fields[K] extends FieldRef<infer T> ? T : never;
  }>;

export type ElastigraphObjectFieldsShape<
  Types extends SchemaTypes,
  Fields extends FieldMap,
  Shape
> = (t: ElastigraphFieldBuilder<Types, Shape>) => Fields;

export interface ElasticsearchMapper {
  addEsProperty: (fieldName: string, options: MappingProperty) => void;
  buildGetByIdQuery: () => void;
  addFieldType: (fieldName: 'keyword' | 'text', fieldType: string) => void;
  gqlFieldsToEsField: (fieldName: string) => string;
  init: (pothosBuilder: PothosSchemaTypes.SchemaBuilder<SchemaTypes>) => void;
  // init: (pothosBuilder:SchemaBuilder<SchemaTypes>) => void;
  createRootType: (rootType: PothosSchemaTypes.ObjectRef<any, any> ) => void;
  setIdField: (idField: string) => void;
  createIndex: () => void;
  properties: Record<string, MappingProperty>;
}
