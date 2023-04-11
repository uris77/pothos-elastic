import {
    ObjectRef,
    SchemaTypes,
    typeBrandKey
} from '@pothos/core';


export type WithBrand<T> = T & { [typeBrandKey]: string };

// Copied from the Prisma Plugin. I'm not entirely sure what this does. Right now we are using
// it as the return type of the elasticsearch builder.
export class ElasticsearchObjectRef<Types extends SchemaTypes> extends ObjectRef<Types> {

    constructor(name: string ) {
        super(name);

    }



    // keyword<
    //     Name extends string,
    //     Shape,
    //     Type extends TypeParam<Types>,
    //     Nullable extends boolean,
    //     ResolveReturnShape>(
    //         ...args: NormalizeArgs<
    // [
    //     name: Name,
    //     options: PothosSchemaTypes.ObjectFieldOptions<
    //         Types,
    //         Shape,
    //         Type,
    //         Nullable,
    //         any,
    //         ResolveReturnShape>
    // ]>) {
    //     const [name, options = {} as never] = args;
    // }
}
