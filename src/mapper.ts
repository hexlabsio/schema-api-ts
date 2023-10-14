import {
  OAS,
  OASOperation,
  OASParameter,
  OASPath,
  OASRef,
  OASRequestBody,
  OASResponse,
  OASSecurityScheme
} from "./oas";

export interface PathInfo {
  paths?: {
    [key: string]: PathInfo;
  };
  methods?: string[];
  security?: {
    [method: string]: {
      scopes: string[]
    }
  }
}

interface ParamType {
  name: string;
  multi: boolean;
  required: boolean;
}
export class Method {
  constructor(
    public readonly method: string,
    public readonly responses: Record<string, OASResponse> = {},
    public readonly queryParams: ParamType[] = [],
    public readonly headerParams: ParamType[] = [],
    public readonly scopes: string[] = [],
    public readonly requestType?: string,
    public readonly operationId?: string,
    public readonly aws?: boolean
  ) { }


  routerDefinition(spacing: string, parentNames: string, pathParameters: string[]): [string, string[]] {
    const name = this.operationId ?? `${this.method}${parentNames}Handler`;
    const singleQueries = this.queryParams.filter(it => !it.multi).map(param => `['${param.name}']${param.required ? '': '?'}: string`).join('; ');
    const multiQueries = this.queryParams.filter(it => it.multi).map(param => `['${param.name}']${param.required ? '': '?'}: string[]`).join('; ');
    const singleHeaders = this.headerParams.filter(it => !it.multi).map(param => `['${param.name}']?: string`).join('; ');
    const multiHeaders = this.headerParams.filter(it => it.multi).map(param => `['${param.name}']?: string[]`).join('; ');
    const singleHeaderNames = '[' + this.headerParams.filter(it => !it.multi).map(it => `'${it.name}'`).join(', ') + ']';
    const multiHeaderNames = '[' + this.headerParams.filter(it => it.multi).map(it => `'${it.name}'`).join(', ') + ']';
    const paths = pathParameters.map(it => `${it}: string`).join('; ');
    const returner = Object.keys(this.responses).map(statusCode => {
      const response = this.responses[statusCode];
      const contentTypes = Object.keys(response.content ?? {});
      const responses = contentTypes.map(contentType => {
        const media = response.content![contentType];
        const headers = Object.keys(response.headers ?? {});
        const headerParam = headers.map(it => `['${it}']?: string`).join(', ');
        if(contentType === 'application/json') {
          const responseType = media.schema?.$ref;
          const responseTypeName = responseType?.substring(responseType?.lastIndexOf('/') + 1);
          return `json(body: Model.${responseTypeName}, headers?: {${headerParam}}): APIGatewayProxyResult`;
        } else if (contentType === 'application/text') {
          return `text(body: string, headers?: {${headerParam}}): APIGatewayProxyResult`;
        }
        return `['${contentType}'](body: string, headers?: {${headerParam}}): APIGatewayProxyResult`;
      });
      return `[${statusCode}]: { ${responses.join(', ')} }`;
    }).join(', ');
    const returnerImplementation = Object.keys(this.responses).map(statusCode => {
      const response = this.responses[statusCode];
      const contentTypes = Object.keys(response.content ?? {});
      const responses = contentTypes.map(contentType => {
        const media = response.content![contentType];
        const headers = Object.keys(response.headers ?? {});
        const headerParam = headers.map(it => `['${it}']?: string`).join(', ');
        if(contentType === 'application/json') {
          const responseType = media.schema?.$ref;
          const responseTypeName = responseType?.substring(responseType?.lastIndexOf('/') + 1);
          return `json(body: Model.${responseTypeName}, headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body: JSON.stringify(body), headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
        } else if (contentType === 'application/text') {
          return `text(body: string, headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body, headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
        }
        return `['${contentType}'](body: string, headers?: {${headerParam}}): APIGatewayProxyResult { return { statusCode: ${statusCode}, body, headers: { ...(headers ?? {}), ['Content-Type']: '${contentType}' } } }`;
      });
      return `[${statusCode}]: { ${responses.join(', ')} }`;
    }).join(', ');
    const handlerType = `(request: ${this.aws ? `APIGatewayProxyEvent, parts: Parts<{${singleQueries}},{${multiQueries}},{${paths}},{${singleHeaders}},{${multiHeaders}}>, respondWith: { ${returner} }` : 'Req'}) => Promise<${this.aws ? 'APIGatewayProxyResult' : 'Response'}>`;
    return [`${spacing}bind(HttpMethod.${this.method.toUpperCase()}, ${this.aws ? `mapped(${singleHeaderNames}, ${multiHeaderNames},`: ''}(...params: any[]) => this.handlers.${name}?.bind(this)?.(...params, { ${returnerImplementation} }) ?? (async () => ({statusCode: 501, body: 'Not Implemented'})))${this.aws ? ')': ''}`, [name + `: ${handlerType}`]];
  }
}

function isOASParam(param: OASParameter | OASRef): param is OASParameter {
  return !Object.keys(param).includes("$ref");
}
export class Path {
  constructor(public part: string, public paths: Path[] = [], public methods: Method[] = [], private hydra = false, private readonly aws = false) {
  }

  append(route: string[], path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    if (route.length === 0) {
      const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      Object.keys(path).filter(it => methods.includes(it)).forEach(method => {
        const definition = (path as any)[method] as OASOperation;
         const queries = definition.parameters?.filter(p => isOASParam(p) && p.in === "query")?.map(p => (p as OASParameter)) ?? [];
         const headers = definition.parameters?.filter(p => isOASParam(p) && p.in === "header")?.map(p => (p as OASParameter)) ?? [];
        const queryDefinitions:ParamType[] = queries.map(it => ({name: it.name, required: !!it.required, multi: it.schema?.type === 'array'}))
        const headerDefinitions:ParamType[] = headers.map(it => ({name: it.name, required: !!it.required, multi: it.schema?.type === 'array'}))
        const scopes = (definition.security ?? []).flatMap(it => Object.keys(it).flatMap(key => it[key]))
          const requestType = (definition.requestBody as OASRequestBody)?.content?.['application/json']?.schema?.$ref;
          const requestTypeName = requestType?.substring(requestType?.lastIndexOf('/') + 1);
          this.methods.push(new Method(method, definition.responses as any, queryDefinitions, headerDefinitions, [...new Set(scopes)], requestTypeName, definition.operationId, this.aws))
        }
      );
    } else {
      const [root, ...rest] = route;
      const existing = this.paths.find(it => it.part === root);
      if (existing) {
        existing.append(rest, path, securitySchemes);
      } else {
        this.paths.push(new Path(root, [], [], this.hydra, this.aws).append(rest, path, securitySchemes));
      }
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return {
      ['/' + this.part]: {
        security: this.methods.reduce((prev, method) => ({...prev, [method.method.toUpperCase()]: { scopes: method.scopes }}), {}),
        methods: this.methods.map(method => method.method.toUpperCase()),
        paths: this.paths.reduce((paths, path) => ({ ...paths, ...path.pathInfo() }), {})
      }
    };
  }

  private capitilize(name: string): string {
    return name.substring(0, 1).toUpperCase() + name.substring(1);
  }
  private name(): string {
    return this.part.startsWith('{') ? ('By' + this.capitilize(this.part.substring(1, this.part.length - 1))) : this.capitilize(this.part);
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  routerDefinition(spacing: string, parentNames = '', parentParts: string[] = [], parameters: string[] = []): [string, string[], string[]] {
    const nextParentNames = parentNames + this.name();
    const nextParameters = this.part.startsWith('{') ? [...parameters, this.part.substring(1, this.part.length - 1)] : parameters;
    const nextParentParts = [...parentParts, this.part];
    const methodDefinitions = this.methods.map(method => method.routerDefinition(spacing + '  ', nextParentNames, nextParameters));
    const resourceDefinitions = this.paths.map(path => path.routerDefinition(spacing + '  ', nextParentNames, nextParentParts, nextParameters));
    const typesToValidate = [...new Set(this.methods.filter(method => !!method.requestType).map(method => method.requestType!))];
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
      return [${this.methods.length === 0 ? '' : '\n'}${this.methods.map(method => `        { method: '${method.method.toUpperCase()}', statusCodes: [${Object.keys(method.responses).join(',')}], scopes: [${method.scopes.map(scope => `'${scope}'`).join(',')}] as S[] }`).join(',\n')}${this.methods.length === 0 ? '' : '\n      '}];
    }`;
    const resourceDefinitionFunction = `    get${nextParentNames}ResourceDefinition(${uriParams.length > 0 ? [...uriParams, 'idOnly = false'].join(', ') : ''}): ResourceApiDefinition<S>{
      return {
        id: ${uriParams.length > 0 ? `idOnly ? ${nextParameters[nextParameters.length - 1]} :`: ''}\`\${this.host}\${this.basePath}\${this.get${nextParentNames}Uri(${nextParameters.join(', ')})}\`,
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
    const validationFunctions = typesToValidate.map(typeName =>`    validate${typeName}(item: string): Model.${typeName} {
      const mapped: Model.${typeName} = JSON.parse(item);
      const validation = Validator.validateUnknown(mapped, '#/components/schemas/${typeName}', {schema, current: schema.components.schemas.${typeName}});
      if(validation.length > 0) throw new HttpError(400, JSON.stringify(validation));
      return mapped;
    }`);
    return [`${spacing}bind('/${this.part}', router([\n${[...methodBinds, ...resourceBinds].join(',\n')}\n${spacing}]))`, methods, [...idFunctions, idFunction, ...(this.hydra ? [operationsFunction, resourceDefinitionFunction, collectionDefinitionFunction] : []), ...validationFunctions]];
  }
}

export class PathFinder {

  constructor(public apiName: string, public paths: Path[] = [], private readonly hydra = false, private readonly aws = false) { }

  append(route: string, path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    const [root, ...rest] = route.substring(1).split('/');
    const existing = this.paths.find(it => it.part === root);
    if (existing) {
      existing.append(rest, path, securitySchemes);
    } else {
      this.paths.push(new Path(root, [], [], this.hydra, this.aws).append(rest, path, securitySchemes));
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return this.paths.reduce((paths, path) => ({ ...paths, ...path.pathInfo() }), {});
  }

  private routerDefinition(): [string, string[], string[]] {
    const definitions = this.paths.map(path => path.routerDefinition('      '));
    const binds = definitions.map(it => it[0]);
    const methods = definitions.flatMap(it => it[1]);
    const idFunctions = definitions.flatMap(it => it[2]);
    return [`router${this.aws ? '<APIGatewayProxyEvent, APIGatewayProxyResult>': '<Req, Response>'}([\n${binds.join(',\n')}\n    ])`, methods, idFunctions];
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  apiDefinition(version?: string): string {
    const [router, methods, idFunctions] = this.routerDefinition();
    const scopes = [...new Set(this.paths.flatMap(it => it.methods.flatMap(it => it.scopes)))];
    const defaultS = scopes.length === 0 ? 'string' : scopes.map(it => `'${it}'`).join(' | ');
    const generics = (this.aws ? (this.hydra ? `<S extends string = ${defaultS}>` : '') : '<Req extends Request, Response' + this.hydra ? `, S extends string = ${defaultS}>` : '>');
    const interfaceGenerics = (this.aws ? '' : '<Req extends Request, Response>');
    return `//@ts-nocheck
import {bind, Handler, HttpMethod, HttpError, router, Request} from '@hexlabs/http-api-ts';
${this.aws ? "import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';" : ""}
${this.hydra ? "import {ResourceApiDefinition, CollectionApiDefinition, ScopedOperation} from '@hexlabs/lambda-api-ts';" : ""}
// eslint-disable-next-line @typescript-eslint/no-var-requires
import schema from './schema.json';
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

export interface ${this.apiName}Handlers${interfaceGenerics} {
${methods.map(method => `    ${method};`).join('\n')}
}

export class ${this.apiName}${generics} {

    constructor(${this.hydra ? "protected readonly host: string, protected readonly basePath: string, " : ""}public readonly version = '${version ?? '1.0.0'}'){}
    
    public readonly handlers: Partial<${this.apiName}Handlers${this.aws ? '' : '<Req, Response>'}> = {};
    
    public readonly routes = () => ${router};

${[...new Set(idFunctions)].join('\n')}
}`;
  }

  static from(openapi: OAS, hydra: boolean, aws: boolean): PathFinder {
    return Object.keys(openapi.paths).reduce((pathFinder, path) => {
      return pathFinder.append(path, openapi.paths[path] as OASPath, openapi.components?.securitySchemes);
    }, new PathFinder(openapi.info.title.replace(/\W+/g, ''), [], hydra, aws));
  }
}
