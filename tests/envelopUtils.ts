import * as GraphqlJS from 'graphql';
import {
  Plugin,
  envelop,
  useEngine,
  useErrorHandler,
  useSchema,
} from '@envelop/core';
import {
  GatewayExecutor,
  GatewayInterface,
  GatewayLoadResult,
  GatewaySchemaLoadOrUpdateCallback,
  GatewayUnsubscriber,
} from '@apollo/server-gateway-interface';

// See: https://github.com/n1ru4l/envelop/blob/86c026f/examples/apollo-server/index.ts

type EnvelopOptions = {
  plugins?: Plugin[];
  enableInternalTracing?: boolean;
};

export const buildEnvelopApolloGateway = (
  schema: GraphqlJS.GraphQLSchema,
  options: EnvelopOptions
) => {
  const plugins = [
    useEngine(GraphqlJS),
    useSchema(schema),
    ...(options.plugins ?? []),
  ];

  const getEnveloped = envelop({
    plugins: [
      ...plugins,
      useErrorHandler((errors) => {
        console.error(errors);
      }),
    ],
    enableInternalTracing: options.enableInternalTracing,
  });

  const executor: GatewayExecutor = async (requestContext) => {
    const { schema, execute, contextFactory } = getEnveloped({
      req: requestContext.request.http,
    });

    return execute({
      schema,
      document: requestContext.document,
      contextValue: await contextFactory(),
      variableValues: requestContext.request.variables,
      operationName: requestContext.operationName,
    });
  };

  // Apollo Server 4 requires a custom gateway to enable custom executors:
  // https://www.apollographql.com/docs/apollo-server/migration/#executor
  class Gateway implements GatewayInterface {
    private schemaCallback?: GatewaySchemaLoadOrUpdateCallback;

    async load(): Promise<GatewayLoadResult> {
      // Apollo expects this schema to be called before this function resolves:
      // https://github.com/apollographql/apollo-server/issues/7340#issuecomment-1407071706
      this.schemaCallback?.({ apiSchema: schema, coreSupergraphSdl: '' });

      return { executor };
    }

    onSchemaLoadOrUpdate(
      callback: GatewaySchemaLoadOrUpdateCallback
    ): GatewayUnsubscriber {
      this.schemaCallback = callback;
      return () => {};
    }

    async stop() {}
  }

  return new Gateway();
};
