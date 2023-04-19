import SchemaBuilder, {BasePlugin, PothosOutputFieldConfig, SchemaTypes} from "@pothos/core";
export * from './lib/types';
import './lib/global-types';
import './lib/schema-builder';
import {GraphQLSchema} from "graphql/type";
import {MapperRegistry} from "./lib/schema-builder";
import {lexicographicSortSchema, printSchema} from "graphql/index";
import fs from "fs";
import {MappingProperty, PropertyName} from "@elastic/elasticsearch/lib/api/types";

const pluginName = 'elastigraph' as const;
export default pluginName;

export class ElastigraphPlugin<Types extends SchemaTypes> extends BasePlugin<Types> {
  override onOutputFieldConfig(fieldConfig: PothosOutputFieldConfig<Types>): PothosOutputFieldConfig<Types> | null {
    return fieldConfig;
  }

  override beforeBuild() {
    super.beforeBuild();
    // Create the queries and mutations. We have to do this after all the fields have been defined.
    this.builder.configStore.prepareForBuild();
    const mappers = MapperRegistry.allMappers();
    mappers.forEach(mapper => {
      mapper.buildGetByIdQuery();
      mapper.buildCreateMutation();
    });

  }

  override afterBuild(schema: GraphQLSchema): GraphQLSchema {
      // Write the schema to a file.
      const schemaAsString = printSchema(lexicographicSortSchema(schema));
      const filePath = this.builder.options.elastigraph.schemaFile;
      fs.writeFileSync(filePath, schemaAsString);

      // Write the Elasticsearch mapping to a file.
      const mappers = MapperRegistry.mappers;
      const esMapping: Record<string,  Record<PropertyName, MappingProperty>> = {};
      mappers.forEach((mapper, key) => {
        esMapping[key] = { properties: mapper.properties };
      });
      const esMappingFilePath = this.builder.options.elastigraph.esMappingFile;
      fs.writeFileSync(esMappingFilePath, JSON.stringify(esMapping, null, 2));
      return schema;
  }
}

SchemaBuilder.registerPlugin(pluginName, ElastigraphPlugin);
