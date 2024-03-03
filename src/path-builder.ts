import { OASOperation, OASParameter, OASPath, OASServer } from './oas';
import { OpenApiSpecificationBuilder } from './schema-type';

export type MethodBuilder<SCHEMA> = (o: SCHEMA) => OASOperation
export type PathBuilderFor<SCHEMA> = SCHEMA extends OpenApiSpecificationBuilder<infer S> ? (path: PathBuilder<S>) => PathBuilder<S> : never;
export class PathBuilder<S extends {components: {schemas?: any, responses?: Record<string, any>}}> {
  private path: Record<string, OASPath> = {};
  constructor(private readonly name: string, private readonly builder: OpenApiSpecificationBuilder<S>) {
    const matches = name.matchAll(/{([^/]+)}/);
    this.set('parameters', [...matches].map(([, match]) => builder.path(match)));
  }
  
  child(name: string, builder: (paths: PathBuilder<S>) => PathBuilder<S>): this {
    const pathBuilder = new PathBuilder(this.name + '/' + name, this.builder);
    const childPaths = builder(pathBuilder);
    this.path = {...this.path, ...childPaths.path};
    return this;
  }

  resource(name: string, builder: (paths: PathBuilder<S>) => PathBuilder<S>): this {
    return this.child(`{${name}}`, builder);
  }

  private set<K extends keyof OASPath>(key: K, value: OASPath[K]): this {
    this.path[this.name] = { ...this.path[this.name], [key]: value };
    return this;
  }
  summary(summary: string): this { return this.set('summary', summary); }
  description(description: string): this { return this.set('description', description); }
  servers(...servers: OASServer[]): this { return this.set('servers', servers); }
  parameters(...parameters: OASParameter[]): this { return this.set('parameters', parameters); }
  get(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('get', { ...builder(this.builder), operationId });
  }
  put(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('put', { ...builder(this.builder), operationId });
  }
  post(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('post', { ...builder(this.builder), operationId });
  }
  delete(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('delete', { ...builder(this.builder), operationId });
  }
  options(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('options', { ...builder(this.builder), operationId });
  }
  head(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('head', { ...builder(this.builder), operationId });
  }
  patch(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('patch', { ...builder(this.builder), operationId });
  }
  trace(operationId: string, builder: MethodBuilder<OpenApiSpecificationBuilder<S>>): this {
    return this.set('trace', { ...builder(this.builder), operationId });
  }
}


