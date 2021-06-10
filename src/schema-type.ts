import {JSONSchema} from "json-schema-to-typescript";
import {OASEncoding, OASInfo, OASMedia} from "./oas";
import {OAS, OASComponents} from "./oas";

type UnionToTuple<T> = (
  (
    (
      T extends any
        ? (t: T) => T
        : never
      ) extends infer U
      ? (U extends any
      ? (u: U) => any
      : never
        ) extends (v: infer V) => any
      ? V
      : never
      : never
    ) extends (_: any) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : []
  );

type Ref<S, R extends string> = R extends `${infer Start}/${infer Rest}` ? (Start extends '#' ? Ref<S, Rest> : (Start extends keyof S ? Ref<S[Start], Rest> : never)) : (R extends keyof S ? S[R] : never)
type FromProps<S, O = S> = S extends {properties: any} ? { -readonly [K in keyof S['properties']]: Schema<S['properties'][K], O> } : {};
type FromArray<S, O = S> = S extends {items: readonly any[]} ? FromTuple<S['items'], O> : S extends {items: any} ? Array<Schema<S['items'], O>> : never;
type FromTuple<T extends readonly any[], O> = T extends readonly [infer HEAD, ...infer TAIL] ? [Schema<HEAD, O>, ...FromTuple<TAIL, O>]: [];
type AllOf<T extends any[], O> = T extends readonly [infer HEAD] ? Schema<HEAD> : T extends readonly [infer HEAD, ...infer TAIL] ? Schema<HEAD, O> & AllOf<TAIL, O>: never
type AnyOf<T extends any[], O> = T extends readonly [infer HEAD] ? Schema<HEAD> : T extends readonly [infer HEAD, ...infer TAIL] ? Schema<HEAD, O> | AnyOf<TAIL, O>: never
type AdditionalProps<T, S, O> = S extends { additionalProperties: false } ? T : (S extends { additionalProperties: true } ? T & {[key: string]: unknown} : (S extends {additionalProperties: any} ? T & {[key: string]: Schema<S['additionalProperties'], O>} : T & {[key: string]: unknown}));
type Required<T, S> = S extends { required: readonly [...infer R] } ? { [K in keyof T]-?: K extends KeysIn<R> ? T[K] : T[K] | undefined}: Partial<T>
type KeysIn<T extends any[]> = T extends [infer HEAD] ? HEAD : T extends [infer HEAD, ...infer TAIL] ? HEAD | KeysIn<TAIL> : never;
export type Schema<S, O = S> = S extends {type: 'string'} ? (S extends {const: infer C} ? C : string) :
  S extends { type: 'number'} ? number :
      S extends {type: 'array'} ? FromArray<S, O> :
        S extends { '$ref': string } ? Schema<Ref<O, S['$ref']>, O> :
          S extends { allOf: any } ? AllOf<S['allOf'], O> :
            S extends { anyOf: any } ? AnyOf<S['anyOf'], O> : AdditionalProps<Required<FromProps<S, O>, S>, S, O>


export type SchemaType<S extends string = string> = Record<S, JSONSchema>;

type FilteredKeys<T> = { [P in keyof T]: T[P] extends never ? never : P }[keyof T];

type Stripped<T> = { [Q in FilteredKeys<T>]: T[Q] };

type Combine<A,B> = A extends undefined ? ( B extends undefined ? never : B) : ( B extends undefined ? A : A & B)

type ObjectSchema<A extends boolean | JSONSchema | undefined = false, R extends Record<string, JSONSchema>| undefined = undefined, O extends JSONSchema | undefined= undefined> = Stripped<{type: 'object', title: string, additionalProperties: A extends undefined ? never : A, required: R extends undefined ? never: UnionToTuple<keyof R>, properties: Combine<R,O> }>;
type ArraySchema<R, A extends boolean | JSONSchema | undefined = undefined> = Stripped<{type: 'array', title: string, additionalItems: A extends undefined ? never : A, items: R }>;

export class SchemaBuilder<T extends {components:{schemas: any}}> {
  
  private constructor(private readonly schemaParent: T, private readonly title?: string) {}
  
  build(): T {
    return this.schemaParent
  }
  
  object<R extends Record<string, JSONSchema> | undefined = undefined,O = undefined, A extends boolean | JSONSchema | undefined = false, P extends JSONSchema | undefined = undefined>
  (required: R = undefined as unknown as R, optional: O = undefined as unknown as O, additionalProperties: A = false as unknown as A, title = this.title, parts: P = undefined as unknown as P): ObjectSchema<A, R, O> {
    return {
      type: 'object',
      title,
      additionalProperties,
      required: Object.keys(required ?? {}),
      properties: {
        ...required,
        ...optional
      },
      ...parts
    } as any
  }
  
  array<R, A extends boolean | JSONSchema | undefined = undefined, P extends JSONSchema | undefined = undefined>
  (items: R, additionalItems: A = undefined as unknown as A, title = this.title, parts: P = undefined as unknown as P): ArraySchema<R, A> {
    return {
      type: 'array',
      title,
      items,
      additionalItems,
      ...parts
    } as any
  }
  
  anyOf<S extends (builder: SchemaBuilder<T>) => any>(builder: S): S extends (...args: any) => infer O ? { anyOf: O } : never {
    return { anyOf: builder(this) } as any;
  }
  allOf<S extends (builder: SchemaBuilder<T>) => any>(builder: S): S extends (...args: any) => infer O ? { allOf: O } : never {
    return { allOf: builder(this) } as any;
  }
  oneOf<S extends (builder: SchemaBuilder<T>) => any>(builder: S): S extends (...args: any) => infer O ? { oneOf: O } : never {
    return { oneOf: builder(this) } as any;
  }
  
  list<T extends any[]>(...items: T): T {
    return items;
  }
  
  stringWith<P>(parts: P): Combine<{type: 'string'}, P> {
    return {type: 'string', ...(parts ?? {})} as any;
  }
  numberWith<P>(parts: P): Combine<{type: 'number'}, P> {
    return {type: 'number', ...(parts ?? {})} as any;
  }
  booleanWith<P extends JSONSchema>(parts: P): Combine<{type: 'boolean'}, P> {
    return {type: 'boolean', ...(parts ?? {})} as any;
  }
  
  string(): {type: 'string'} { return {type: 'string'} }
  number(): {type: 'number'} { return {type: 'number'} }
  boolean(): {type: 'boolean'} { return {type: 'boolean'} }
  
  reference<K extends keyof T['components']['schemas']>(key: K): { '$ref': K extends string ? `#/components/schemas/${K}` : string } {
    return { '$ref': `#/components/schemas/${key}` } as any;
  }
  
  hydraOperation(): ObjectSchema<undefined, {statusCodes: ArraySchema<{type: 'string'}>, method: {type: 'string'}}, {expects: {type: 'string'}, returns: {type: 'string'}}> {
    return this.object({statusCodes: this.array(this.string()), method: this.string()}, {expects: this.string(), returns: this.string()});
  }
  
  hydraResource<K extends keyof T['components']['schemas']>(reference: K): T['components']['schemas'][K] extends {type: 'object'} ? T['components']['schemas'][K] & {type: 'object', properties: {'@id': {type: 'string'}, '@operation': ReturnType<SchemaBuilder<any>['hydraOperation']>}} : never{
    const other: JSONSchema = this.schemaParent.components.schemas[reference];
    if(!Object.keys(this.schemaParent.components.schemas).includes('HydraOperation')) this.add('HydraOperation', () => this.hydraOperation());
    if(other.type === 'object') {
      return {
        ...other,
        properties: {
          ...other.properties,
          '@id': this.string(),
          '@operation': this.reference('HydraOperation')
        }
      } as any;
    }
    throw new Error('Must be an object to map to hydra resource')
  }
  
  hydraCollection<K extends keyof T['components']['schemas']>(reference: K): T['components']['schemas'][K] extends {type: 'object'} ? {type: 'object', required: ['@id', '@operation', 'member'], properties: {'@id': {type: 'string'}, '@operation': ReturnType<SchemaBuilder<any>['hydraOperation']>, 'member': ArraySchema<T['components']['schemas'][K]>}} : never{
    const other: JSONSchema = this.schemaParent.components.schemas[reference];
    if(other.type === 'object') {
      if(!Object.keys(this.schemaParent.components.schemas).includes('HydraOperation')) this.add('HydraOperation', () => this.hydraOperation());
      return this.object({'@id': this.string(), '@operation': this.reference('HydraOperation'), member: this.array(other)}) as any
    }
    throw new Error('Must be an object to map to hydra resource')
  }
  
  add<K extends string, B extends (builder: SchemaBuilder<T & {components:{schemas: {[k in K]: any }}}>) => any>(name: K, schema: B): B extends (s: any) => infer S ? SchemaBuilder<T & {components:{schemas: {[k in K]: S }}}>: never {
    return new SchemaBuilder({components: {schemas: {...this.schemaParent.components.schemas, [name]: schema(new SchemaBuilder(this.schemaParent, name)) }}}, name) as any;
  }
  
  static create(): SchemaBuilder<{components:{schemas: {}}}> {
    return new SchemaBuilder({components:{schemas: {}}});
  }
}

export class OpenApiSpecificationBuilder<S extends {components: {schemas?: any, responses?: Record<string, any>}}> {
  private constructor(public oas: OAS) {
  }
  
  build(): OAS {
    return this.oas;
  }
  
  jsonContent<K extends keyof S['components']['schemas']>(
    key: K,
    example?: Schema<S['components']['schemas'][K], S>,
    examples?: Record<string, Schema<S['components']['schemas'][K], S>>,
    encoding?: { [key: string]: OASEncoding }
  ): { 'application/json': OASMedia } {
    return {'application/json': this.media(key, example, examples, encoding)};
  }
  
  textContent(example?: string, examples?: Record<string, string>, encoding?: { [key: string]: OASEncoding }): { 'application/text': OASMedia } {
    return {'application/text': {schema: SchemaBuilder.create().string(), example, examples, encoding}};
  }
  
  responseReference<K extends keyof S['components']['responses']>(key: K): { '$ref': K extends string ? `#/components/responses/${K}` : string } {
    return this.componentReference('responses', key);
  }
  
  media<K extends keyof S['components']['schemas']>(
    key: K,
    example?: Schema<S['components']['schemas'][K], S>,
    examples?: Record<string, Schema<S['components']['schemas'][K], S>>,
    encoding?: { [key: string]: OASEncoding }
  ): OASMedia {
    return {schema: this.reference(key), example, examples, encoding}
  }
  
  reference<K extends keyof S['components']['schemas']>(key: K): { '$ref': K extends string ? `#/components/schemas/${K}` : string } {
    return this.componentReference('schemas', key);
  }
  
  componentReference<K extends keyof S['components'], T extends keyof S['components'][K]>(componentKey: K, key: T): { '$ref': K extends string ? T extends string ? `#/components/${K}/${T}` : string : string } {
    return {'$ref': `#/components/${componentKey}/${key}`} as any;
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
  
  add<K extends keyof OAS>(location: K, itemBuilder: (builder: this) => OAS[K]): this {
    const item = itemBuilder(this);
    if (typeof item === "object") {
      if (Array.isArray(item)) {
        this.oas = {...this.oas, [location]: [...(this.oas[location] as any[] ?? []), ...item]};
      } else {
        this.oas = {...this.oas, [location]: {...(this.oas[location] as any ?? {}), ...(item as any)}};
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
