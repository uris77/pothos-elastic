import {FieldKind, NormalizeArgs, RootFieldBuilder, SchemaTypes, TypeParam} from "@pothos/core";

// Workaround for FieldKind not being extended on Builder classes
const RootBuilder: {
    // eslint-disable-next-line @typescript-eslint/prefer-function-type
    new <Types extends SchemaTypes, Shape, Kind extends FieldKind>(
        name: string,
        builder: PothosSchemaTypes.SchemaBuilder<Types>,
        kind: FieldKind,
        graphqlKind: PothosSchemaTypes.PothosKindToGraphQLType[FieldKind],
    ): PothosSchemaTypes.RootFieldBuilder<Types, Shape, Kind>;
} = RootFieldBuilder as never;
export class ElasticsearchFieldBuilder<
    Types extends SchemaTypes,
    NeedsResolve extends boolean,
    Shape extends object = {}
> extends RootBuilder<Types, Shape, 'Elasticsearch'> {
    constructor(name: string, builder: PothosSchemaTypes.SchemaBuilder<Types>) {
        super(name, builder, 'Elasticsearch', 'Object');
    }

    keyword<
        Type extends TypeParam<Types>,
        Nullable extends boolean,
        ResolveReturnShape,
        Name extends string,
    >(
        ...args: NormalizeArgs<
            [
                name: Name,
                options: PothosSchemaTypes.ObjectFieldOptions<
                Types,
                Shape,
                Type,
                Nullable,
                {},
                ResolveReturnShape
                >
            ]
            >
    ) {
        const [name] = args;

        return this.field(name);
    }
}