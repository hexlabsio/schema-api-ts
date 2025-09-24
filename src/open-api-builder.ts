import { JSONSchema } from 'json-schema-to-typescript';
import {
  OAS, OASComponents, OASEncoding,
  OASInfo, OASMedia, OASOAuthFlows, OASOperation, OASParameter, OASPath,
  OASRef,
  OASResponse,
  OASSecurity,
  OASSecurityScheme
} from './oas';
import { PathBuilder } from './path-builder';

export type OASParts = {
  schemes: string[];
  apiIntegrations: string[];
}

export class OpenApiSpecificationBuilder<
  S extends {components: {schemas?: any, responses?: Record<string, any>}},
  T extends OASParts = { schemes: [], apiIntegrations: [] }
> {

  parts: OASParts = {
    schemes: [],
    apiIntegrations: []
  }

  private constructor(public oas: OAS) {
  }

  private _defaultResponses: OASOperation["responses"] = {};

  build(): OAS {
    return this.oas;
  }

  withAWSCognitoSecurityScheme<K extends string>(key: K, userPoolEndpoint: string, clientId: string, identitySource = '$request.header.Authorization')
    : OpenApiSpecificationBuilder<S, { schemes: [...T['schemes'], K], apiIntegrations: T['apiIntegrations'] }> {
    const scheme: OASSecurityScheme = {
      type: "oauth2",
      "x-amazon-apigateway-authorizer": {
        type: "jwt",
        jwtConfiguration: {
          issuer: userPoolEndpoint,
          audience: [clientId]
        },
        identitySource: identitySource
      }
    };
    this.parts.schemes.push(key);
    return this.addComponent('securitySchemes', () => ({ [key]: scheme })) as any;
  }

  withAWSLambdaApiGatewayIntegration<const K extends string>(key: K, functionUri: string, payloadFormatVersion: '1.0' | '2.0' = '1.0', passthroughBehavior: 'when_no_templates' | 'when_no_match' | 'never' = 'when_no_templates')
    : OpenApiSpecificationBuilder<S, { schemes: T['schemes'], apiIntegrations: [...T['apiIntegrations'], K],  }> {
    const scheme = {
      type: "aws_proxy",
      httpMethod: "POST",
      uri: functionUri,
      passthroughBehavior: passthroughBehavior,
      payloadFormatVersion: payloadFormatVersion
    };
    this.parts.apiIntegrations.push(key);
    return this.addComponent('x-amazon-apigateway-integrations',() => ({ [key]: scheme })) as any;
  }

  get securitySchemes(): Record<T['schemes'][number], (scopes?: string[]) => OASSecurity> {
    const schemes = this.parts.schemes.reduce((prev, key) => {
      return {...prev, [key]: ((scopes?: string[]) => {
          return { [key]: scopes ?? [] }
        })}
    },{} as any) as any;
    return schemes;
  }

  get awsLambdaApiGatewayIntegration(): Record<T['apiIntegrations'][number], {'$ref': string}> {
    const apiIntegrations = this.parts.apiIntegrations.reduce((prev, key) => {
      return {...prev, [key]: {"$ref": `#/components/x-amazon-apigateway-integrations/${key}`}}
    },{} as any) as any;
    return apiIntegrations;
  }

  withPath(name: string, builder: (path: PathBuilder, oas: this) => PathBuilder): this {
    const pathBuilder = builder(new PathBuilder('/' + name), this);
    this.oas.paths = {...(this.oas.paths ?? {}), ...pathBuilder.path };
    return this;
  }

  jsonContent<K extends keyof S['components']['schemas']>(
    key: K,
    example?: any,
    examples?: Record<string, any>,
    encoding?: { [key: string]: OASEncoding }
  ): { 'application/json': OASMedia } {
    return {'application/json': this.media(key, example, examples, encoding)};
  }

  textContent(example?: string, examples?: Record<string, string>, encoding?: { [key: string]: OASEncoding }): { 'application/text': OASMedia } {
    return {'application/text': {schema: { type: 'string' }, example, examples, encoding}};
  }

  response(content: OASResponse['content'], description = '', headers: string[] = []): OASResponse {
    return {description, content, headers: headers.reduce((prev, name) => ({ ...prev, [name]: {required: true, schema: { type: 'string' }} }), {})}
  }

  textResponse<K extends keyof S['components']['schemas']>(
    description = '',
    headers: string[] = [],
    example?: any,
    examples?: Record<string, any>,
    encoding?: { [key: string]: OASEncoding }
  ): OASResponse {
    return this.response(this.textContent(example, examples, encoding), description, headers);
  }

  jsonResponse<K extends keyof S['components']['schemas']>(
    key: K,
    description = '',
    headers: string[] = [],
    example?: any,
    examples?: Record<string, any>,
    encoding?: { [key: string]: OASEncoding }
  ): OASResponse {
    return this.response(this.jsonContent(key, example, examples, encoding), description, headers);
  }

  responseReference<K extends keyof S['components']['responses']>(key: K): { '$ref': K extends string ? `#/components/responses/${K}` : string } {
    return this.componentReference('responses', key);
  }

  media<K extends keyof S['components']['schemas']>(
    key: K,
    example?: any,
    examples?: Record<string, any>,
    encoding?: { [key: string]: OASEncoding }
  ): OASMedia {
    return {schema: this.reference(key), example, examples, encoding}
  }

  basicAuthScheme(description = ''): OASSecurityScheme {
    return {
      type: 'http',
      scheme: 'basic',
      description,
    }
  }

  apiKeyScheme(in_: "header" | "query" | "cookie", name: string, description = ''): OASSecurityScheme {
    return {
      type: 'apiKey',
      in: in_,
      name,
      description,
    }
  }

  bearerScheme(description = ''): OASSecurityScheme {
    return {
      type: 'http',
      scheme: 'bearer',
      description
    }
  }

  oAuth2Scheme(flows: OASOAuthFlows, description = ''): OASSecurityScheme {
    return {
      type: 'oauth2',
      flows,
      description
    }
  }

  openIdConnectScheme(openIdConnectUrl: string, description = ''): OASSecurityScheme {
    return {
      type: 'openIdConnect',
      openIdConnectUrl,
      description
    }
  }

  query(name: string, required = true, multiple = false): OASParameter {
    return this.parameter(name, "query", required, multiple ? {type: "array", items: {type: "string"}} : {type: "string"})
  }

  header(name: string, required = true): OASParameter {
    return this.parameter(name, "header", required)
  }


  parameter(name: string, location: OASParameter['in'], required = true, schema: JSONSchema = {type: "string"}): OASParameter {
    return {
      name,
      in: location,
      required,
      schema
    }
  }

  reference<K extends keyof S['components']['schemas']>(key: K): { '$ref': K extends string ? `#/components/schemas/${K}` : string } {
    return this.componentReference('schemas', key);
  }

  componentReference<K extends keyof S['components'], T extends keyof S['components'][K]>(componentKey: K, key: T): { '$ref': K extends string ? T extends string ? `#/components/${K}/${T}` : string : string } {
    return {'$ref': `#/components/${componentKey as string}/${key as string}`} as any;
  }

  defaultResponses(itemBuilder: (builder: this) => Exclude<OASComponents["responses"], undefined>): this {
    this._defaultResponses = itemBuilder(this);
    return this
  }

  addComponent<K extends keyof OASComponents, B extends (builder: this) => OASComponents[K]>(location: K, itemBuilder: B): B extends (builder: any) => infer R ? OpenApiSpecificationBuilder<S & { components: { [k in K]: R } }> : never {
    const item = itemBuilder(this);
    const current = this.oas.components ?? {};
    if (typeof item === "object") {
      if (Array.isArray(item)) {
        this.oas = {
          ...this.oas,
          components: {...current, [location]: [...(current[location] as unknown as any[] ?? []), ...item]}
        };
      } else {
        this.oas = {
          ...this.oas,
          components: {...current, [location]: {...(current[location] as any ?? {}), ...(item as any)}}
        };
      }
    } else {
      this.oas = {...this.oas, components: {...current, [location]: item}};
    }
    return this as any;
  }

  private modifyOperationWithDefaultResponses(operation?: OASOperation): OASOperation | undefined {
    if(operation) {
      const { responses, ...rest } = operation;
      return {...rest, responses: { ...this._defaultResponses, ...responses } }
    }
  }
  private addDefaultResponsesToPath(path: OASPath | OASRef): OASPath | OASRef {
    if((path as OASRef).$ref) return path;
    const {
      get,
      put,
      post,
      delete: deleteOp,
      options,
      head,
      patch,
      trace,
      ...rest
    } = path as OASPath;
    return {
      ...rest,
      ...(get ? {get: this.modifyOperationWithDefaultResponses(get)} : {}),
      ...(put ? {put: this.modifyOperationWithDefaultResponses(put)} : {}),
      ...(post ? {post: this.modifyOperationWithDefaultResponses(post)} : {}),
      ...(deleteOp ? {delete: this.modifyOperationWithDefaultResponses(deleteOp)} : {}),
      ...(options ? {options: this.modifyOperationWithDefaultResponses(options)} : {}),
      ...(head ? {head: this.modifyOperationWithDefaultResponses(head)} : {}),
      ...(patch ? {patch: this.modifyOperationWithDefaultResponses(patch)} : {}),
      ...(trace ? {trace: this.modifyOperationWithDefaultResponses(trace)} : {}),
      ...rest
    }
  }

  private addDefaultResponses(paths: OAS["paths"]): OAS["paths"] {
    return Object.keys(paths).reduce((previousValue, path) => ({ ...previousValue, [path]: this.addDefaultResponsesToPath(paths[path])}), {})
  }

  add<K extends keyof OAS>(location: K, itemBuilder: (builder: this) => OAS[K]): this {
    const item = itemBuilder(this);
    if (typeof item === "object") {
      if (Array.isArray(item)) {
        this.oas = {...this.oas, [location]: [...(this.oas[location] as any[] ?? []), ...item]};
      } else {
        this.oas = {...this.oas, [location]: {...(this.oas[location] as any ?? {}), ...(location === "paths" ? this.addDefaultResponses(item as any) : (item as any))}};
      }
    } else {
      this.oas = {...this.oas, [location]: item};
    }
    return this;
  }

  static create<S extends { components: { schemas: any, responses?: Record<string, any> } }>(schemas: S, info: OASInfo): OpenApiSpecificationBuilder<S> {
    return new OpenApiSpecificationBuilder<S>({openapi: '3.0.0', info, paths: {}, ...schemas as any});
  }
}
