import { ApiGenerator } from './generator';
import { Method } from '../paths/method';
import { Path } from '../paths/path';
import { PathFinder } from '../paths/path-finder';

export class HexlabsGenerator implements ApiGenerator {

  private readonly aws = true;
  private readonly hydra = true;

  generate(definition: PathFinder, version?: string): string {
    return this.apiDefinition(definition, version);
  }

  private routerDefinition(pathFinder: PathFinder): [string, string[], string[]] {
    const definitions = pathFinder.paths.map(path => this.pathRouterDefinition(path, '      '));
    const binds = definitions.map(it => it[0]);
    const methods = definitions.flatMap(it => it[1]);
    const idFunctions = definitions.flatMap(it => it[2]);
    return [`router<APIGatewayProxyEvent, APIGatewayProxyResult>([\n${binds.join(',\n')}\n    ])`, methods, idFunctions];
  }

  methodRouterDefinition(method: Method, spacing: string, parentNames: string, pathParameters: string[]): [string, string[]] {
    const name = method.operationId ?? `${method.method}${parentNames}Handler`;
    const singleQueries = method.queryParams.filter(it => !it.multi).map(param => `['${param.name}']${param.required ? '' : '?'}: string`).join('; ');
    const multiQueries = method.queryParams.filter(it => it.multi).map(param => `['${param.name}']${param.required ? '' : '?'}: string[]`).join('; ');
    const singleHeaders = method.headerParams.filter(it => !it.multi).map(param => `['${param.name}']?: string`).join('; ');
    const multiHeaders = method.headerParams.filter(it => it.multi).map(param => `['${param.name}']?: string[]`).join('; ');
    const singleHeaderNames = '[' + method.headerParams.filter(it => !it.multi).map(it => `'${it.name}'`).join(', ') + ']';
    const multiHeaderNames = '[' + method.headerParams.filter(it => it.multi).map(it => `'${it.name}'`).join(', ') + ']';
    const paths = pathParameters.map(it => `${it}: string`).join('; ');
    const returner = Object.keys(method.responses).map(statusCode => {
      const response = method.responses[statusCode];
      const contentTypes = Object.keys(response.content ?? {});
      const responses = contentTypes.map(contentType => {
        const media = response.content![contentType];
        const headers = Object.keys(response.headers ?? {});
        const headerParam = headers.map(it => `['${it}']?: string`).join(', ');
        if (contentType === 'application/json') {
          const responseType = media.schema?.$ref;
          const responseTypeName = responseType?.substring(responseType?.lastIndexOf('/') + 1);
          return `json(body: Model.${responseTypeName}, headers?: {${headerParam}}): APIGatewayProxyResult`;
        } else if (contentType === 'application/text') {
          return `text(body = '', headers?: {${headerParam}}): APIGatewayProxyResult`;
        }
        return `['${contentType}'](body: string, headers?: {${headerParam}}): APIGatewayProxyResult`;
      });
      return `[${statusCode}]: { ${responses.join(', ')} }`;
    }).join(', ');
    const returnerImplementation = Object.keys(method.responses).map(statusCode => {
      const response = method.responses[statusCode];
      const contentTypes = Object.keys(response.content ?? {});
      const responses = contentTypes.map(contentType => {
        const media = response.content![contentType];
        const headers = Object.keys(response.headers ?? {});
        const headerParam = headers.map(it => `['${it}']?: string`).join(', ');
        if (contentType === 'application/json') {
          const responseType = media.schema?.$ref;
          const responseTypeName = responseType?.substring(responseType?.lastIndexOf('/') + 1);
          return `json(body: Model.${responseTypeName}, headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body: JSON.stringify(body), headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
        } else if (contentType === 'application/text') {
          return `text(body = '', headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body, headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
        }
        return `['${contentType}'](body = '', headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body, headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
      });
      return `[${statusCode}]: { ${responses.join(', ')} }`;
    }).join(', ');
    const handlerType = `(request: ${this.aws ? `APIGatewayProxyEvent, parts: Parts<{${singleQueries}},{${multiQueries}},{${paths}},{${singleHeaders}},{${multiHeaders}}>, respondWith: { ${returner} }` : 'Req'}) => Promise<${this.aws ? 'APIGatewayProxyResult' : 'Response'}>`;
    return [`${spacing}bind(HttpMethod.${method.method.toUpperCase()}, ${this.aws ? `mapped(${singleHeaderNames}, ${multiHeaderNames},` : ''}(...params: any[]) => this.handlers['${name}']?.bind(this)?.(...params, { ${returnerImplementation} }) ?? (async () => ({statusCode: 501, body: 'Not Implemented'})))${this.aws ? ')' : ''}`, [`'${name}'` + `: ${handlerType}`]];
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  pathRouterDefinition(path: Path, spacing: string, parentNames = '', parentParts: string[] = [], parameters: string[] = []): [string, string[], string[]] {
    const nextParentNames = parentNames + path.name();
    const nextParameters = path.part.startsWith('{') ? [...parameters, path.part.substring(1, path.part.length - 1)] : parameters;
    const nextParentParts = [...parentParts, path.part];
    const methodDefinitions = path.methods.map(method => this.methodRouterDefinition(method, spacing + '  ', nextParentNames, nextParameters));
    const resourceDefinitions = path.paths.map(path => this.pathRouterDefinition(path, spacing + '  ', nextParentNames, nextParentParts, nextParameters));
    const typesToValidate = [...new Set(path.methods.filter(method => !!method.requestType).map(method => method.requestType!))];
    const methodBinds = methodDefinitions.map(it => it[0]);
    const resourceBinds = resourceDefinitions.map(it => it[0]);
    const idFunctions = resourceDefinitions.flatMap(it => it[2]);
    const methods = [...methodDefinitions.flatMap(it => it[1]), ...resourceDefinitions.flatMap(it => it[1])];
    const ids = nextParentParts.map(it => it.startsWith('{') ? ('${' + it.substring(1, it.length - 1) + '}') : it);
    const uriParams = nextParameters.map(it => `${it}: string`);
    const idFunction = `    get${nextParentNames}Uri(${uriParams.join(',')}): string {
      return ${'`/'}${ids.join('/')}${'`'};
    }`;
    const operationsFunction = `    get${nextParentNames}Operations(): Array<{method: string; statusCodes: number[]; scopes: S[]}> {
      return [${path.methods.length === 0 ? '' : '\n'}${path.methods.map(method => `        { method: '${method.method.toUpperCase()}', statusCodes: [${Object.keys(method.responses).join(',')}], scopes: [${method.scopes.map(scope => `'${scope}'`).join(',')}] as S[] }`).join(',\n')}${path.methods.length === 0 ? '' : '\n      '}];
    }`;
    const resourceDefinitionFunction = `    get${nextParentNames}ResourceDefinition(${uriParams.length > 0 ? [...uriParams, 'idOnly = false'].join(', ') : ''}): ResourceApiDefinition<S>{
      return {
        id: ${uriParams.length > 0 ? `idOnly ? ${nextParameters[nextParameters.length - 1]} :` : ''}\`\${this.host}\${this.basePath}\${this.get${nextParentNames}Uri(${nextParameters.join(', ')})}\`,
        operations: this.get${nextParentNames}Operations()
      }
    }
`
    const collectionDefinitionFunction = `    get${nextParentNames}CollectionDefinition(${[...uriParams, 'resourceOperations: ScopedOperation<S>[]'].join(', ')}): CollectionApiDefinition<S>{
      return {
        id: \`\${this.host}\${this.basePath}\${this.get${nextParentNames}Uri(${nextParameters.join(', ')})}\`,
        operations: this.get${nextParentNames}Operations(),
        member: {
          operations: resourceOperations
        }
      }
    }
`
    const validationFunctions = typesToValidate.map(typeName => `    validate${typeName}(item: string): Model.${typeName} {
      const mapped: Model.${typeName} = JSON.parse(item);
      const validation = Validator.validateUnknown(mapped, '#/components/schemas/${typeName}', {schema, current: schema.components.schemas.${typeName}});
      if(validation.length > 0) throw new HttpError(400, JSON.stringify(validation));
      return mapped;
    }`);
    return [`${spacing}bind('/${path.part}', router([\n${[...methodBinds, ...resourceBinds].join(',\n')}\n${spacing}]))`, methods, [...idFunctions, idFunction, ...(this.hydra ? [operationsFunction, resourceDefinitionFunction, collectionDefinitionFunction] : []), ...validationFunctions]];
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  apiDefinition(pathFinder: PathFinder, version?: string): string {
    const [router, methods, idFunctions] = this.routerDefinition(pathFinder);
    const scopes = [...new Set(pathFinder.paths.flatMap(it => it.methods.flatMap(it => it.scopes)))];
    const defaultS = scopes.length === 0 ? 'string' : scopes.map(it => `'${it}'`).join(' | ');
    const generics = (this.aws ? (`<S extends string = ${defaultS}>`) : '<Req extends Request, Response' + this.hydra ? `, S extends string = ${defaultS}>` : '>');
    const interfaceGenerics = (this.aws ? '' : '<Req extends Request, Response>');
    return `//@ts-nocheck
import {bind, Handler, HttpMethod, HttpError, router, Request} from '@hexlabs/http-api-ts';
${this.aws ? "import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';" : ""}
${this.hydra ? "import {ResourceApiDefinition, CollectionApiDefinition, ScopedOperation} from '@hexlabs/lambda-api-ts';" : ""}
// eslint-disable-next-line @typescript-eslint/no-var-requires
import schema from './schema.json' assert { type: 'json' };
import * as Model from "./model";
import {Validator} from '@hexlabs/schema-api-ts';

${this.aws ? `export interface Parts<Q extends Record<string, string>,MQ extends Record<string, string[]>,P extends Record<string, string>,H extends Record<string, string>,MH extends Record<string, string[]>> {
  query: Q,
  multiQuery: MQ,
  path: P,
  headers: H,
  multiHeaders: MH,
}

function mapped(headers: string[], multiHeaders: string[], fn: (request: APIGatewayProxyEvent, parts: Parts<any, any, any, any, any>) => Promise<APIGatewayProxyResult>): Handler<APIGatewayProxyEvent, APIGatewayProxyResult> {
  return event => {
    const eventHeaders = Object.keys(event.headers ?? {});
    const selectedHeaders = headers.reduce((newHeaders, name) => {
      const match = eventHeaders.find(h => name.toLowerCase() === h.toLowerCase());
      return {...newHeaders, [name]: match ? (event.headers ?? {})[match] : undefined};
    }, {} as any);
    const eventMultiHeaders = Object.keys(event.multiValueHeaders ?? {});
    const selectedMultiHeaders = multiHeaders.reduce((newHeaders, name) => {
      const match = eventMultiHeaders.find(h => name.toLowerCase() === h.toLowerCase());
      return {...newHeaders, [name]: match ? (event.multiValueHeaders ?? {})[match] : undefined};
    }, {} as any);
    return fn(event, {query: event.queryStringParameters ?? {}, multiQuery: event.multiValueQueryStringParameters ?? {}, path: event.pathParameters ?? {}, headers: selectedHeaders, multiHeaders: selectedMultiHeaders});
  }
}
` : ''}

export interface ${pathFinder.apiName}Handlers${interfaceGenerics} {
${methods.map(method => `    ${method};`).join('\n')}
}

export class ${pathFinder.apiName}${generics} {

    constructor(${this.hydra ? "protected readonly host: string, protected readonly basePath: string, " : ""}public readonly version = '${version ?? '1.0.0'}'){}
    
    public readonly handlers: Partial<${pathFinder.apiName}Handlers${this.aws ? '' : '<Req, Response>'}> = {};
    
    public readonly routes = () => ${router};

${[...new Set(idFunctions)].join('\n')}
}`;

  }
}
