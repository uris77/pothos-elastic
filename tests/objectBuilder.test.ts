import { describe, it } from 'vitest';
import SchemaBuilder from "@pothos/core";
import ElastigraphPlugin from "../src";
import {printSchema} from "graphql/utilities";
import {snakeCase} from "lodash";
import phraseGenerate from 'project-name-generator';
import {Client} from "@elastic/elasticsearch";
import DirectivePlugin from '@pothos/plugin-directives';
import fs from "fs";
import {GraphQLSchema} from "graphql/type";
import {MappingProperty, PropertyName} from "@elastic/elasticsearch/lib/api/types";

const esMappingFile =  `${__dirname}/testMapping.json`;
const host =  'http://localhost:9200';
const esClient = new Client({ node: host });
const settings = {
  number_of_shards: 1,
  number_of_replicas: 0,
};

describe("Elastigraph Object Builder", () => {
  let schema: GraphQLSchema;

  it("builds a type", async () => {
    const randomPhrase = phraseGenerate({
      words: 2,
      number: false
    }).dashed;
    const indexName = `test_${snakeCase(randomPhrase)}`;
    const schemaFile =  `${__dirname}/testSchema.graphql`;
    const builder = new SchemaBuilder(
      {
        plugins: [ElastigraphPlugin, DirectivePlugin],
        elastigraph: {
          indexName,
          host,
          schemaFile,
          esMappingFile,
        }
      }
    );

    builder.elastigraphObject('Movie', {
      fields: (t) => ({
        id: t.ID({list: false, nullable: false, required: true }),
        title: t.keyword({ list: true, nullable: true }),
        director: t.keyword({list: false, nullable: false}),
      })
    });
    schema = builder.toSchema();
    const schemaAsString = printSchema(schema);
    console.log("Schema: ", schemaAsString);
    // Create Elasticsearch index
    const rawMapping = fs.readFileSync(esMappingFile, 'utf8');
    const esMapping: Record<string, Record<PropertyName, MappingProperty>> = JSON.parse(rawMapping);
    for (const esMappingKey in esMapping) {
      await esClient.indices.create({
        index: esMappingKey,
        settings,
        mappings: esMapping[esMappingKey],
      });
    }

  });

});
