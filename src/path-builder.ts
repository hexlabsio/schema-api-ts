import { OASOperation, OASParameter, OASPath, OASServer } from './oas';

export class PathBuilder {
  public path: Record<string, OASPath> = {};

  constructor(private readonly name: string) {
    const matches = name.matchAll(/{([^/]+)}/g);
    this.set('parameters', [...matches].map((match) => {
      const parameter: OASParameter = {
        name: match[1],
        in: 'path',
        required: true,
        schema: {type: "string"}
      };
      return parameter;
    }));
  }
  
  childPath(name: string, builder: (paths: PathBuilder) => PathBuilder): this {
    const pathBuilder = new PathBuilder(this.name + '/' + name);
    const childPaths = builder(pathBuilder);
    this.path = {...this.path, ...childPaths.path};
    return this;
  }

  resource(name: string, builder: (paths: PathBuilder) => PathBuilder): this {
    return this.childPath(`{${name}}`, builder);
  }

  private set<K extends keyof OASPath>(key: K, value: OASPath[K]): this {
    this.path[this.name] = { ...(this.path[this.name] ?? {}), [key]: value };
    return this;
  }
  summary(summary: string): this { return this.set('summary', summary); }
  description(description: string): this { return this.set('description', description); }
  servers(...servers: OASServer[]): this {
    return this.set('servers', servers);
  }
  parameters(...parameters: OASParameter[]): this { return this.set('parameters', parameters); }
  get(operationId: string, operation: OASOperation): this {
    return this.set('get', { ...operation, operationId });
  }
  put(operationId: string, operation: OASOperation): this {
    return this.set('put', { ...operation, operationId });
  }
  post(operationId: string, operation: OASOperation): this {
    return this.set('post', { ...operation, operationId });
  }
  delete(operationId: string, operation: OASOperation): this {
    return this.set('delete', { ...operation, operationId });
  }
  options(operationId: string, operation: OASOperation): this {
    return this.set('options', { ...operation, operationId });
  }
  head(operationId: string, operation: OASOperation): this {
    return this.set('head', { ...operation, operationId });
  }
  patch(operationId: string, operation: OASOperation): this {
    return this.set('patch', { ...operation, operationId });
  }
  trace(operationId: string, operation: OASOperation): this {
    return this.set('trace', { ...operation, operationId });
  }
}


