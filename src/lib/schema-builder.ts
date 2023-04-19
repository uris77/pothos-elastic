import SchemaBuilder, {ObjectRef, SchemaTypes} from "@pothos/core";
import {ElastigraphFieldBuilder} from "./field-builder";
import {ElastigraphMapper} from "./mapper";

const schemaBuilder = SchemaBuilder.prototype as PothosSchemaTypes.SchemaBuilder<SchemaTypes>;

schemaBuilder.elastigraphObject = function elastigraphObject(
  type,
  {
    fields,
    ...options
  }) {
  const ref = new ObjectRef(type);
  ref.name = type;
  let mapper = MapperRegistry.getMapper(type);
  if(!mapper) {
    mapper = MapperRegistry.createMapper(type, this.options.elastigraph.host, this.options.elastigraph.indexName);
  }
  mapper.init(this);
  mapper.createRootType(ref);

  this.objectType(ref, {
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...(options as {}),
    name: type,
    fields: fields
      ? () => fields(new ElastigraphFieldBuilder(type, this, mapper as ElastigraphMapper))
      : undefined,
  });

  return ref as never;
}


export class MapperRegistry {
  static mappers = new Map<string, ElastigraphMapper>();

  static getMapper(name: string): ElastigraphMapper | undefined {
    return MapperRegistry.mappers.get(name.toLowerCase());
  }

  static createMapper(name: string, host: string, indexName: string): ElastigraphMapper {
    const existingMapper = MapperRegistry.getMapper(name.toLowerCase());
    if(existingMapper) {
      return existingMapper;
    }
    const mapper = new ElastigraphMapper(host, indexName.toLowerCase());
    MapperRegistry.mappers.set(name.toLowerCase(), mapper);
    return mapper;
  }

  static allMappers(): ElastigraphMapper[] {
    return Array.from(MapperRegistry.mappers.values());
  }
}
