import SchemaBuilder, {SchemaTypes} from "@pothos/core";
import {ElasticsearchObjectRef} from "./object-ref";
import {ElasticsearchFieldBuilder} from "./field-builder";

const schemaBuilder = SchemaBuilder.prototype as PothosSchemaTypes.SchemaBuilder<SchemaTypes>;

schemaBuilder.elasticsearch = function elasticsearch(
    type,
    {
        fields,
        ...options
    }) {
    const ref = new ElasticsearchObjectRef(type);
    ref.name = type;

    this.objectType(ref, {
    ...(options as {}),
        name: type,
        fields: fields
        ? () => fields(new ElasticsearchFieldBuilder(type, this))
            : undefined,
    });

    return ref as never;
    }