import { ElasticsearchMapper } from './types';
import {Client} from "@elastic/elasticsearch";
import {camelCase, chunk, mapKeys, snakeCase} from "lodash";
import {IndicesIndexSettings, MappingProperty, PropertyName, SearchHit} from "@elastic/elasticsearch/lib/api/types";
import pluralize from 'pluralize';
import  {ObjectRef, SchemaTypes} from "@pothos/core";
import {mapValues} from "lodash";
import Bottleneck from "bottleneck";

const defaultIndexSettings: IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
};

type EsHit = Omit<SearchHit<unknown>, '_source'> & { data: unknown };
export interface GqlContext {
  requestId: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultPothosTypes {
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
  Context: GqlContext;
  Directives: {
    oneOf: {
      locations: 'INPUT_OBJECT';
    };
  };
  DefaultFieldNullability: false;
  DefaultInputFieldRequiredness: false;
}


/**
 * ElastigraphMapper keeps track of the mapping between Elasticsearch and GraphQL.
 * It is responsible for creating the custom input types, query types and mutation types for Elasticsearch queries.
 * These types are dynamically created based on the fields defined by the user.
 */
export class ElastigraphMapper implements ElasticsearchMapper{
  private esClient: Client;
  // private pothosBuilder: PothosSchemaTypes.SchemaBuilder<PothosSchemaTypes.ExtendDefaultTypes<DefaultPothosTypes>> | undefined;
  private pothosBuilder: PothosSchemaTypes.SchemaBuilder<SchemaTypes> | undefined;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private RootType: ObjectRef<any, any>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private OutputType: ObjectRef<any, any>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ItemType: ObjectRef<any, any>;
  CreateInputTypeFields: Record<string, {list: boolean, required: boolean, type: 'keyword' | 'text'}> = {};

  fieldTypes: Record<string, string[]> = { text: [], keyword: [] };
  gqlFieldsToEsProperties: Record<string, string> = {};
  esPropertiesToGqlFields: Record<string, string> = {};
  properties: Record<PropertyName, MappingProperty> = {
    __typename: { type: 'keyword' },
  };
  typeName: string | undefined;
  indexName: string;
  idField = '';

  constructor(host: string, indexName: string ) {
    this.indexName = indexName;
    this.esClient = new Client({ node: host });
  }

  private renameSource = (hits:SearchHit<unknown>[]): { hits: { data: any[]}} => {
    const hitsCopy: EsHit[] = [];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const hit of hits.hits) {
      const source = hit['_source'];
        hitsCopy.push({ ...hit, data: source });
      // hit.data = source;
      // delete hit['_source'];
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return hitsCopy;

  }

  init(pothosBuilder: PothosSchemaTypes.SchemaBuilder<SchemaTypes>): void {
    this.pothosBuilder = pothosBuilder;
    this.pothosBuilder.queryType({fields: () => ({})});
  }

  createKeywordInputType(fieldName: string, options: { list: boolean; required: boolean }) {
    const {  CreateInputTypeFields} = this;
    CreateInputTypeFields[fieldName] = {
      list: options.list,
      required: options.required,
      type: 'keyword'
    };
  }
  createItemType(): void {
    const { pothosBuilder, RootType } = this;
    if(pothosBuilder) {
      const ref = new ObjectRef('ItemType');
      this.ItemType = pothosBuilder.objectType(ref,{
        name: 'ItemType',
        fields: (t) => ({
          data: t.field({
            type: RootType,
            nullable: false,
            resolve: () => ({} as never),
          }),
        }),
      });
    }
  }

  createOutputType(): void {
    const { pothosBuilder, ItemType} = this;
    if(pothosBuilder) {
    const ref = new ObjectRef('OutputType');
    this.OutputType = pothosBuilder.objectType(ref,{
      name: 'OutputType',
      fields: (t) => ({
        hits: t.field({type: [ItemType],  nullable: false, resolve: () => ({} as never)}),
      })
    });
    }
  }

  createRootType(rootType: ObjectRef<any, any>): void {
    if(this.pothosBuilder) {
      this.typeName = rootType.name;
      this.RootType = rootType;
      this.createItemType();
      this.createOutputType();
    }
  }

  /**
   * Builds the mutation for creating a new document in Elasticsearch.
   */
  buildCreateMutation() {
    const { pothosBuilder, typeName,  CreateInputTypeFields } = this;
    if(!pothosBuilder) {
      throw new Error('No pothos builder was defined. You need to initialize the mapper with a builder using the init method.');
    }

    if(!typeName) {
      throw new Error('No type name was defined. You need to initialize the mapper with a builder using the createRootType method.');
    }
   // Create the input type
    const CreateType = pothosBuilder.inputType(`Create${typeName}Input`, {
      fields: (t) => {
        return mapValues(CreateInputTypeFields, (v) => {
          if (v.list) {
            return t.stringList({
              required: v.required,
            });
          }
          return t.string({
            required: v.required,
          });
        });
      }
    });
    pothosBuilder.mutationField(`create${pluralize(typeName)}`, (t) => {
      return t.field({
        type: 'Int',
        args: {
          data: t.arg({ type: [CreateType], required: true}),
          batchSize: t.arg.int({defaultValue: 500, required: true}),
          maxConcurrent: t.arg.int({ defaultValue: 2, required: true}),
        },
        resolve: async(_root, { data, batchSize, maxConcurrent }) => {
          const { idField, gqlFieldsToEsProperties, typeName , indexName, esClient} = this;
          const limiter = new Bottleneck({ maxConcurrent: maxConcurrent as number });
          if(idField === undefined) {
            throw new Error(`
            Cannot create new ${pluralize(typeName ?? 'index')} without defining an 'id' field.)}`);
          }
          const bulkLines = data.flatMap((d) => {
            const _id = `${snakeCase(typeName)}_${d[idField]}`;
            const operation = { index: { _id } };
            const doc = mapKeys(d, (_v, k) => gqlFieldsToEsProperties[k] ?? k);
            doc['__typename'] = typeName;
            return [operation, doc];
          });
          await Promise.all(
            chunk(bulkLines, batchSize as number).map((lines) =>
              limiter.schedule(() =>
                esClient.bulk({index: indexName, body: lines})
              )
            )
          );
          return data.length;
        },
      })
    });
  }

  setIdField(fieldName: string){
    this.idField = fieldName;
  }

  addEsProperty(fieldName: string, options: MappingProperty): void {
    const esPropertyName = snakeCase(fieldName);
    if (this.properties[esPropertyName] !== undefined) {
      throw new Error(`Property ${esPropertyName} already exists`);
    }
    this.gqlFieldsToEsProperties[fieldName] = esPropertyName;
    this.esPropertiesToGqlFields[esPropertyName] = fieldName;
    this.properties[esPropertyName] = options;
  }

  addFieldType(fieldType: 'keyword' | 'text', fieldName: string): void {
    this.fieldTypes[fieldType] =[
      ...this.fieldTypes[fieldType],
     this.gqlFieldsToEsProperties[fieldName]
    ];
  }

  gqlFieldsToEsField(fieldName: string):  string {
    return this.gqlFieldsToEsProperties[fieldName];
  }

  buildGetByIdQuery(): void {
    const { idField } = this;
    const {
      gqlFieldsToEsProperties,
      pothosBuilder ,
      indexName,
      typeName} = this;
    if(!typeName) {
     throw new Error('Type name is not defined');
    }
    const getByIdQueryName = camelCase(pluralize(typeName, 1));
    if(pothosBuilder) {
      pothosBuilder.queryFields((t) => {
        if(idField === '') {
          throw new Error(`No ID field defined for type ${typeName}`);
        }
        console.log('getIdByQueryName: ', getByIdQueryName);
        return {
          [getByIdQueryName]: t.field({
            type: this.OutputType,
            args: {
              [idField]: t.arg.string({ required: true }),
            },
            resolve: async (_root, args) => {
              const query = {
                term: {
                  [gqlFieldsToEsProperties[idField]]: args[idField],
                }
              };
              const response = await this.esClient.search({
                index: indexName,
                body: {
                  size: 1,
                  query
                }
              });
              response.hits.hits[0]._source
              const hits = this.renameSource(response.hits.hits);
              return hits as any;
            }
          })
        }
      });
    }
  }

  async createIndex()  {
    const { indexName, properties, esClient} = this;
    const body = {
      settings: defaultIndexSettings,
      mappings: {
        properties,
      }
    };
    await esClient.indices.create({
      index: indexName,
      body,
    });
  }
}
