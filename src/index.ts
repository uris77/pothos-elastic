import SchemaBuilder, {BasePlugin, SchemaTypes} from "@pothos/core";
import './global-types';
import './schema-builder';
export * from './types';

const pluginName = 'elasticsearch' as const;
export default pluginName
export class ElasticsearchPlugin<Types extends SchemaTypes> extends BasePlugin<Types> {

}

SchemaBuilder.registerPlugin(pluginName, ElasticsearchPlugin);