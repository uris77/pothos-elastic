import {FieldMap, FieldRef, NullableToOptional, SchemaTypes} from "@pothos/core";

export type OutputShapeFromFields<Fields extends FieldMap> = NullableToOptional<{
    [K in keyof Fields]: Fields[K] extends FieldRef<infer T> ? T : never
}>;

export type ElasticsearchObjectFieldsShape<Types extends SchemaTypes, Fields extends FieldMap> = (
    t: PothosSchemaTypes.RootFieldBuilder<Types, unknown, 'Elasticsearch'>,
) => Fields;

