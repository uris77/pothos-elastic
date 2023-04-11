import { describe, it, expect } from "vitest";
import SchemaBuilder from "@pothos/core";
import ElasticsearchPlugin from "../src";

describe('Elasticsearch Object Builder', () => {
    it('should build a type', () => {
        const builder = new SchemaBuilder({
            plugins: [ElasticsearchPlugin]
        });

        builder.elasticsearch('Movie', {
            fields: (t) => ({
                title: t.string({list: true, required: true}),
            }),
        });
    });
})