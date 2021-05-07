import { PathInfo} from "@hexlabs/kloudformation-ts/dist/kloudformation/modules/api";

import {OAS, OASOperation, OASPath} from "./oas";


export class Method {
  constructor(public readonly method: string, public readonly statusCodes: string[] = []) {}

  routerDefinition(parentNames: string, parameters: string[]): [string, string[]] {
    const name = `${this.method}${parentNames}Handler`;
    const handlerType = parameters.length === 0 ? 'Handler': `HandlerWithParams<{${parameters.map(param => `${param}?: string;`).join(', ')}}>`;
    return [`bind(HttpMethod.${this.method.toUpperCase()}, (...args) => this.${name}(...args))`, [name + `: ${handlerType}`]];
  }
}
export class Path {
  constructor(public part: string, public paths: Path[] = [], public methods: Method[] = []) {
  }

  append(route: string[], path: OASPath): this {
    if (route.length === 0) {
      const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      Object.keys(path).filter(it => methods.includes(it)).forEach(method => this.methods.push(new Method(method, Object.keys(((path as any)[method] as OASOperation).responses))));
    } else {
      const [root, ...rest] = route;
      const existing = this.paths.find(it => it.part === root);
      if (existing) {
        existing.append(rest, path);
      } else {
        this.paths.push(new Path(root).append(rest, path));
      }
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return {
      ['/' + this.part]: {
        methods: this.methods.map(method => method.method.toUpperCase()),
        paths: this.paths.reduce((paths, path) => ({...paths, ...path.pathInfo()}), {})
      }
    }
  }

  private capitilize(name: string): string {
    return name.substring(0, 1).toUpperCase() + name.substring(1);
  }
  private name(): string {
    return this.part.startsWith('{') ? ('By' + this.capitilize(this.part.substring(1, this.part.length-1))) : this.capitilize(this.part);
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  routerDefinition(parentNames = '', parentParts: string[] = [], parameters: string[] = []): [string, string[], string[]] {
    const nextParentNames = parentNames + this.name();
    const nextParameters = this.part.startsWith('{') ? [...parameters, this.part.substring(1, this.part.length-1)] : parameters;
    const nextParentParts = [...parentParts, this.part];
    const methodDefinitions = this.methods.map(method => method.routerDefinition(nextParentNames, nextParameters));
    const resourceDefinitions = this.paths.map(path => path.routerDefinition(nextParentNames, nextParentParts, nextParameters));
    const methodBinds = methodDefinitions.map(it => it[0]);
    const resourceBinds = resourceDefinitions.map(it => it[0]);
    const idFunctions = resourceDefinitions.flatMap(it => it[2]);
    const methods = [...methodDefinitions.flatMap(it => it[1]), ...resourceDefinitions.flatMap(it => it[1])];
    const ids = nextParentParts.map(it => it.startsWith('{') ? ('${' + it.substring(1, it.length-1) + '}') : it);
    const idFunction = `get${nextParentNames}Uri(${nextParameters.map(it => `${it}: string`).join(', ')}): string {
    return ${'`/'}${ids.join('/')}${'`'};
}`;
    const operationsFunction = `get${nextParentNames}Operations(): Array<{method: string, statusCodes: number[]}> {
    return [\n${this.methods.map(method => `{ method: '${method.method.toUpperCase()}', statusCodes: [${method.statusCodes.join(',')}] }`).join(',\n')}];
}`;
    return [`bind('/${this.part}', router([\n${[...methodBinds, ...resourceBinds].join(',\n')}\n]))`, methods, [...idFunctions, idFunction, operationsFunction]];
  }
}

export class PathFinder {

  constructor(public apiName: string, public paths: Path[] = []) { }

  append(route: string, path: OASPath): this {
    const [root, ...rest] = route.substring(1).split('/');
    const existing = this.paths.find(it => it.part === root);
    if(existing) {
      existing.append(rest, path);
    } else {
      this.paths.push(new Path(root).append(rest, path));
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return this.paths.reduce((paths, path) => ({...paths, ...path.pathInfo()} ), {})
  }

  private routerDefinition(): [string, string[], string[]] {
    const definitions = this.paths.map(path => path.routerDefinition());
    const binds = definitions.map(it => it[0]);
    const methods = definitions.flatMap(it => it[1])
    const idFunctions = definitions.flatMap(it => it[2])
    return [`router([\n${binds.join(',\n')}\n])`, methods, idFunctions];
  }

  /**
   * Maps to an api definition from @hexlabs/apigateway-ts
   */
  apiDefinition(): string {
    const [router, methods, idFunctions] = this.routerDefinition();
    return `//@ts-ignore\nimport {Api, bind, Handler, HandlerWithParams, HttpMethod, lookup, route, router} from '@hexlabs/apigateway-ts';
export class ${this.apiName} {
   handle = ${router};
   ${methods.map(method => `${method} = async () => ({ statusCode: 501, body: 'Not Implemented' });`).join('\n')}
   ${idFunctions.join('\n')}
}`
  }

  static from(openapi: OAS): PathFinder {
    return Object.keys(openapi.paths).reduce((pathFinder, path) => {
      return pathFinder.append(path, openapi.paths[path] as OASPath) // TODO find path in case of ref
    }, new PathFinder(openapi.info.title.replace(/\W+/g, '')))
  }
}
