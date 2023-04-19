/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import {
  FieldMap,
  InterfaceParam,
  Normalize,
  ParentShape,
  SchemaTypes
} from "@pothos/core";
import {
  ElastigraphObjectFieldsShape, OutputShapeFromFields
} from "./types";
import {ElastigraphPlugin} from "..";


declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PothosSchemaTypes {

    export interface Plugins<Types extends SchemaTypes> {
      elastigraph: ElastigraphPlugin<Types>;
    }
    export interface UserSchemaTypes {
      ElastigraphTypes: Record<string, any>;
    }

    export interface PothosKindToGraphQLType {
      ElastigraphObject: 'Object';
    }

    // TODO: We should add the ES connection here as well.
    export interface ExtendDefaultTypes<
      PartialTypes extends Partial<UserSchemaTypes>> {
      // eslint-disable-next-line @typescript-eslint/ban-types
      ElastigraphTypes: PartialTypes['ElastigraphTypes'] & {};
    }

    export interface SchemaBuilderOptions<Types extends SchemaTypes> {
      elastigraph: {
        indexName: string;
        host: string;
        schemaFile: string;
        esMappingFile: string;
      }
    }
   export interface SchemaBuilder<Types extends SchemaTypes> {
     elastigraphObject: <
       Interfaces extends InterfaceParam<Types>[],
       Fields extends FieldMap,
       Shape extends Normalize<
         OutputShapeFromFields<Fields> & ParentShape<Types, Interfaces[number]>
         >,
        >(
          name: string,
          options: ElastigraphTypeOptions<Types, Interfaces, Fields, Shape>
     ) => ObjectRef<Types>;
   }

    export type ElastigraphTypeOptions<
      Types extends SchemaTypes,
      Interfaces extends InterfaceParam<Types>[],
      Fields extends FieldMap,
      Shape> = Omit<
        PothosSchemaTypes.ObjectTypeOptions<Types, Shape> | ObjectTypeWithInterfaceOptions<Types, Shape, Interfaces>,
        'fields'> & {
      fields?: ElastigraphObjectFieldsShape<Types, Fields, Shape>;
    };

  }
}
