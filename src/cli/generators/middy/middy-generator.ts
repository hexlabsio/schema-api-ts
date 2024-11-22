import { Method } from '../../paths/method';
import { Path } from '../../paths/path';
import { PathFinder } from '../../paths/path-finder';
import { ApiGenerator } from '../generator';
import { route, handlerMethodType, handlerFunction } from './templates/middy-templates';

export class MiddyGenerator implements ApiGenerator {

  private routesFunction(routes: string[]): string {
    return '' +
`routes(): Route<any, APIGatewayProxyResult>[] {
    return [${routes.join(",")}];
  }`;
  }

  private imports() {
    return `import middy from '@middy/core';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { Route } from '@middy/http-router';
import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import schema from './schema.json' with { type: 'json' };
import * as model from './zod-model';
import * as z from 'zod';`
  }

  private apiClassString(className: string, operations:  { path: Path, method: Method }[]): string {
    const routes = operations.map(operation => route(operation.path, operation.method));
    return '' +
`${this.imports()}

${[...new Set(operations.filter(it => !!it.method.requestType).map(it => it.method.requestType))]
  .map(requestType => `const ${requestType}Event = APIGatewayProxyEventSchema.extend({ detail: model.${requestType} });`)
  .join('\n')}

export interface ${className}Handlers {
  ${operations.map(operation => handlerMethodType(operation.method)).join('\n    ')}
}

export class ${className} {
    
    logger = new Logger({ serviceName: '${className}' });
    
${this.routesFunction(routes)}

  public readonly handlers: Partial<${className}Handlers> = {};

  ${operations.map(operation => handlerFunction(operation.method)).join('\n\n  ')}
}
`
  }

  generate(definition: PathFinder, version?: string): string {
    const operations = definition.paths.flatMap(it => it.operations());
    return this.apiClassString(definition.apiName, operations);
  }

}
