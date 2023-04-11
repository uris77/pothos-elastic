# Elasticsearch Pothos Plugin

The purpose of this plugin is to allow users to easily create a Graphql API for an Elasticsearch Index.
This plugin will also create the Elasticsearch mapping based on the field builders used. It will also generate
Graphql queries and mutations based on the field builders used.

Example usage:

```typescript
import SchemaBuilder from "@pothos/core";

const builder = new SchemaBuilder({
    plugins: [ElasticsearchPlugin],
    elasticsearchClient,
});
builder.elasticsearch('Movie', ({
    fields: (t) => ({
        id: t.id(),
        title: t.text(),
        genres: t.keyword({list: true}),
    })
}));
 ```

This will create an elasticsearch movie index that can then be posted to Elasticsearch. It will also create canonical
queries like: `findMovieByID`, `queryMoviesByText`, `findMoviesByTerm`, etc.  


## What Am I struggling with

Currently, I know how to create the custom builder `builder.elasticsearch()`. However, I don't know how to create
custom field builders for the elasticsearch builder. I've been mostly trying to follow the Prisma Plugin, but 
I get lost with the generic types.


