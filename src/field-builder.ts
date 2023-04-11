import { FieldBuilder, NormalizeArgs, SchemaTypes } from '@pothos/core';

type KeywordFieldOptions<
  Types extends SchemaTypes,
  ParentShape,
  Nullable extends boolean,
  IsList extends boolean,
  ResolveReturnShape
> = Omit<
  PothosSchemaTypes.ObjectFieldOptions<
    Types,
    ParentShape,
    IsList extends true ? ['String'] : 'String',
    Nullable,
    {},
    ResolveReturnShape
  >,
  'resolve' | 'args' | 'type'
> & { list: IsList };

export class ElasticsearchFieldBuilder<
  Types extends SchemaTypes,
  Shape = {}
> extends FieldBuilder<Types, Shape, 'Object'> {
  constructor(name: string, builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    super(name, builder, 'Object', 'Object');
  }

  keyword<Nullable extends boolean, IsList extends boolean, ResolveReturnShape>(
    ...args: NormalizeArgs<
      [
        options: KeywordFieldOptions<
          Types,
          Shape,
          Nullable,
          IsList,
          ResolveReturnShape
        >
      ]
    >
  ) {
    const [{ list, ...options }] = args;

    return this.field({
      ...options,
      type: list ? ['String'] : 'String',
      resolve: () => 'test' as never,
    });
  }
}
