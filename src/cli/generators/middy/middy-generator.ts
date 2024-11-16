import { Method } from '../../paths/method';
import { Path } from '../../paths/path';
import { PathFinder } from '../../paths/path-finder';
import { ApiGenerator } from '../generator';
import { route, handlerMethodType, handlerFunction } from './templates/middy-templates';

export class MiddyGenerator implements ApiGenerator {

  private routesFunction(routes: string[]): string {
    return '' +
`routes(): Route<APIGatewayProxyEvent, APIGatewayProxyResult>[] {
    return [${routes.join(",")}];
  }`;
  }

  private imports() {
    return `import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { Route } from '@middy/http-router';
import validatorMiddleware from '@middy/validator';
import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import schema from './schema.json' with { type: 'json' };
import * as model from './model';`
  }

  private apiClassString(className: string, operations:  { path: Path, method: Method }[]): string {
    const routes = operations.map(operation => route(operation.path, operation.method));
    return '' +
`${this.imports()}

export interface ${className}Handlers {
  ${operations.map(operation => handlerMethodType(operation.method)).join('\n    ')}
}

export class ${className} {
    
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
