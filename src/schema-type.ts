import {JSONSchema} from "json-schema-to-typescript";

type Ref<S, R extends string> = R extends `${infer Start}/${infer Rest}` ? (Start extends '#' ? Ref<S, Rest> : (Start extends keyof S ? Ref<S[Start], Rest> : never)) : (R extends keyof S ? S[R] : never)
type FromProps<S, O = S> = S extends {properties: any} ? { -readonly [K in keyof S['properties']]: Schema<S['properties'][K], O> } : {};
type FromArray<S, O = S> = S extends {items: readonly any[]} ? FromTuple<S['items'], O> : S extends {items: any} ? Array<Schema<S['items'], O>> : never;
type FromTuple<T extends readonly any[], O> = T extends readonly [infer HEAD, ...infer TAIL] ? [Schema<HEAD, O>, ...FromTuple<TAIL, O>]: [];
type AllOf<T extends any[], O> = T extends readonly [infer HEAD, ...infer TAIL] ? Schema<HEAD, O> & AllOf<TAIL, O>: {}
type AnyOf<T extends any[], O> = T extends readonly [infer HEAD, ...infer TAIL] ? Schema<HEAD, O> | AllOf<TAIL, O>: {}
type AdditionalProps<T, S, O> = S extends { additionalProperties: false } ? T : (S extends { additionalProperties: true } ? T & {[key: string]: unknown} : (S extends {additionalProperties: any} ? T & {[key: string]: Schema<S['additionalProperties'], O>} : T & {[key: string]: unknown}));
type Required<T, S> = S extends { required: readonly [...infer R] } ? { [K in keyof T]-?: K extends KeysIn<R> ? T[K] : T[K] | undefined}: Partial<T>
type KeysIn<T extends any[]> = T extends [infer HEAD] ? HEAD : T extends [infer HEAD, ...infer TAIL] ? HEAD | KeysIn<TAIL> : never;
export type Schema<S, O = S> = S extends {type: 'string'} ? string :
  S extends { type: 'number'} ? number :
      S extends {type: 'array'} ? FromArray<S, O> :
        S extends { '$ref': string } ? Schema<Ref<O, S['$ref']>, O> :
          S extends { allOf: any } ? AllOf<S['allOf'], O> :
            S extends { anyOf: any } ? AnyOf<S['anyOf'], O> : AdditionalProps<Required<FromProps<S, O>, S>, S, O>


type Name<S extends JSONSchema> = undefined extends S['title'] ? never : S['title']

export type ExtractSchemas<T extends { [key: string]: any }> = { [K in keyof T as `${Name<T[K]>}`]: Schema<T[K]>};
