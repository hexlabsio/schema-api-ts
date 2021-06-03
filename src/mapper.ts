import { PathInfo } from "@hexlabs/kloudformation-ts/dist/kloudformation/modules/api";

import {OAS, OASOperation, OASParameter, OASPath, OASRef, OASSecurityScheme} from "./oas";
export class Method {
  constructor(public readonly method: string,
    public readonly statusCodes: string[] = [],
    public readonly queryParams: string[] = [],
    public readonly scopes: string[] = [],
    public readonly operationId?: string
  ) { }


  routerDefinition(spacing: string, parentNames: string, pathParameters: string[]): [string, string[]] {
    const name = this.operationId ?? `${this.method}${parentNames}Handler`;
    const mapType = (parameters: string[]) => `{${parameters.map(param => `${param}?: string;`).join(' ')}}`;
    const handlerType = pathParameters.length === 0 
      ? 'Handler' 
      : `HandlerWithParams<${mapType(pathParameters)}` + (this.queryParams.length === 0 ? '>' : `, ${mapType(this.queryParams)}>`);
    return [`${spacing}bind(HttpMethod.${this.method.toUpperCase()}, (...args) => this.${name}(...args))`, [name + `: ${handlerType}`]];
  }
}

function isOASParam(param: OASParameter | OASRef): param is OASParameter {
  return !Object.keys(param).includes("$ref");
}
export class Path {
  constructor(public part: string, public paths: Path[] = [], public methods: Method[] = []) {
  }

  append(route: string[], path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    if (route.length === 0) {
      const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      const queryParams = path?.get?.parameters
        ?.filter(p => isOASParam(p) && p.in === "query")
        ?.map(p => (p as OASParameter).name) ?? [];
      Object.keys(path).filter(it => methods.includes(it)).forEach(method => {
          const definition = (path as any)[method] as OASOperation;
          const schemes = (definition.security ?? []).flatMap(it => Object.keys(it)).map(it => securitySchemes?.[it]).filter(it => !!it) as unknown as OASSecurityScheme[];
          const scopes = schemes.flatMap(scheme => [...Object.keys(scheme.flows?.implicit?.scopes ?? {}), ...Object.keys(scheme.flows?.authorizationCode?.scopes ?? {}), ...Object.keys(scheme.flows?.clientCredentials?.scopes ?? {}), ...Object.keys(scheme.flows?.password?.scopes ?? {})]);
          this.methods.push(new Method(method, Object.keys(definition.responses), queryParams, [...new Set(scopes)], definition.operationId))
        }
      );
    } else {
      const [root, ...rest] = route;
      const existing = this.paths.find(it => it.part === root);
      if (existing) {
        existing.append(rest, path, securitySchemes);
      } else {
        this.paths.push(new Path(root).append(rest, path, securitySchemes));
      }
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return {
      ['/' + this.part]: {
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
      return [${this.methods.length === 0 ? '' : '\n'}${this.methods.map(method => `        { method: '${method.method.toUpperCase()}', statusCodes: [${method.statusCodes.join(',')}], scopes: [${method.scopes.map(scope => `'${scope}'`).join(',')}] as S[] }`).join(',\n')}${this.methods.length === 0 ? '' : '\n      '}];
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
    return [`${spacing}bind('/${this.part}', router([\n${[...methodBinds, ...resourceBinds].join(',\n')}\n${spacing}]))`, methods, [...idFunctions, idFunction, operationsFunction, resourceDefinitionFunction, collectionDefinitionFunction]];
  }
}

export class PathFinder {

  constructor(public apiName: string, public paths: Path[] = []) { }

  append(route: string, path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    const [root, ...rest] = route.substring(1).split('/');
    const existing = this.paths.find(it => it.part === root);
    if (existing) {
      existing.append(rest, path, securitySchemes);
    } else {
      this.paths.push(new Path(root).append(rest, path, securitySchemes));
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
    return [`router([\n${binds.join(',\n')}\n    ])`, methods, idFunctions];
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  apiDefinition(version?: string): string {
    const [router, methods, idFunctions] = this.routerDefinition();
    return `import {Api, bind, Handler, HandlerWithParams, HttpMethod, lookup, route, router} from '@hexlabs/apigateway-ts';
import {ResourceApiDefinition, CollectionApiDefinition, ScopedOperation} from '@hexlabs/lambda-api-ts';

export class ${this.apiName}<S extends string = string> {

    constructor(protected readonly host: string, protected readonly basePath: string, public readonly version = '${version ?? '1.0.0'}'){}
    
    public readonly handle = ${router};
    
${methods.map(method => `    ${method} = async () => ({ statusCode: 501, body: 'Not Implemented' });`).join('\n')}

${idFunctions.join('\n')}
}`;
  }

  static from(openapi: OAS): PathFinder {
    return Object.keys(openapi.paths).reduce((pathFinder, path) => {
      return pathFinder.append(path, openapi.paths[path] as OASPath, openapi.components?.securitySchemes);
    }, new PathFinder(openapi.info.title.replace(/\W+/g, '')));
  }
}
