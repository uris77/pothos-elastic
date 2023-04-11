import {FieldMap, InterfaceParam, Normalize, ParentShape, SchemaTypes} from "@pothos/core";
import {ElasticsearchPlugin} from "./index";
import {ElasticsearchObjectFieldsShape, OutputShapeFromFields} from "./types";
import {ElasticsearchObjectRef} from "./object-ref";

declare global {
    export namespace PothosSchemaTypes {
        export interface Plugins<Types extends SchemaTypes> {
            elasticsearch: ElasticsearchPlugin<Types>;
        }
        export interface UserSchemaTypes {
            ElasticsearchTypes: Record<string, any>;
        }

        export interface ExtendDefaultTypes<PartialTypes extends Partial<UserSchemaTypes>> {
            ElasticsearchTypes: PartialTypes['ElasticsearchTypes'] & {};
        }

        export interface PothosKindToGraphQLType {
            Elasticsearch: 'Object';
        }

        export interface SchemaBuilder<Types extends SchemaTypes> {
            elasticsearch: <
            Interfaces extends InterfaceParam<Types>[],
                Fields extends FieldMap,
                Shape extends Normalize<OutputShapeFromFields<Fields> & ParentShape<Types, Interfaces>
                >,
            >(
                name: string,
                options: ElasticsearchTypeOptions<Types, Interfaces, Fields, Shape>
            ) => ElasticsearchObjectRef<Types>;
        }

        export type ElasticsearchTypeOptions<
            Types extends SchemaTypes,
            Interfaces extends InterfaceParam<Types>[],
            Fields extends FieldMap,
            Shape> = Omit<
            PothosSchemaTypes.ObjectTypeOptions<Types, Shape> | ObjectTypeWithInterfaceOptions<Types, Shape, Interfaces>,
            'fields'> & {
            fields?: ElasticsearchObjectFieldsShape<Types, Fields, Shape>;
        };

    }
}
