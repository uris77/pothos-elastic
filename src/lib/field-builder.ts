import { FieldBuilder, NormalizeArgs, SchemaTypes } from '@pothos/core';
import {MappingKeywordProperty } from "@elastic/elasticsearch/lib/api/types";
import {ElastigraphMapper} from "./mapper";

type KeywordFieldOptions<
  Types extends SchemaTypes, //['Keyword'],
  ParentShape,
  Nullable extends boolean,
  IsList extends boolean,
  ResolveReturnShape
> = Omit<
  PothosSchemaTypes.ObjectFieldOptions<
    Types, // extends SchemaTypes['Keyword'],
    ParentShape,
    IsList extends true ? ['String'] : 'String',
    Nullable,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    ResolveReturnShape
  >,
  'resolve' | 'args' | 'type'
> & { list: IsList };



type IDFieldOptions<
  Types extends SchemaTypes,
  ParentShape,
  ResolveReturnShape,
> = Omit<
  PothosSchemaTypes.ObjectFieldOptions<
    Types,
    ParentShape,
    'String',
    false,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    ResolveReturnShape
  >,
'resolve' | 'args' | 'type'
> & { list: false, required: true, nullable: false };
export class ElastigraphFieldBuilder<
  Types extends SchemaTypes,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Shape = {}
> extends FieldBuilder<Types, Shape, 'Object'> {
  name: string;
  mapper: ElastigraphMapper
  idField = '';
  constructor(name: string, builder: PothosSchemaTypes.SchemaBuilder<Types>, mapper: ElastigraphMapper) {
    super(name, builder, 'Object', 'Object');
    this.mapper = mapper;
    this.name = name;
  }

  ID<ResolveReturnShape>(
    ...args: NormalizeArgs<
      [
        options: IDFieldOptions<
          Types,
          Shape,
          ResolveReturnShape
        >
      ]
    >) {
    const [{ ...options}] = args;
    const fieldRef =  this.field({
      ...options,
      type: 'String',
      resolve: () => 'test' as never
    });

    this.builder.configStore.onFieldUse(fieldRef, (fieldConfig) => {
      const fieldName  = fieldConfig.name;
      this.mapper.setIdField(fieldName);
      const mapping: MappingKeywordProperty = { type: 'keyword' };
      this.mapper.addEsProperty(fieldName, mapping);
      this.mapper.addFieldType('keyword', fieldName);
    });
    return fieldRef;
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

    const fieldRef =  this.field({
      ...options,
      type: list ? ['String'] : 'String',
      resolve: (parent, _args,_ctx, info) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return parent[this.mapper.gqlFieldsToEsField(info.fieldName)];
      },
    });
    this.builder.configStore.onFieldUse(fieldRef, (fieldConfig) => {
      const fieldName  = fieldConfig.name;
      const mapping: MappingKeywordProperty = { type: 'keyword' };
      this.mapper.addEsProperty(fieldName, mapping);
      this.mapper.addFieldType('keyword', fieldName);
      this.mapper.createKeywordInputType(fieldName, {
        list,
        required: !options.nullable });
    });
    return fieldRef;
  }
}
